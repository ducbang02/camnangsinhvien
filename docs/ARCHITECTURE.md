# Kiến trúc — Cẩm nang sinh viên

## 1. Mục tiêu kiến trúc

Website là một **Student Hub tĩnh, content-first** dành cho sinh viên Việt Nam. Kiến trúc phải tối ưu cho:

- nội dung hữu ích, dễ tìm và có liên kết theo hành trình;
- SEO kỹ thuật tốt, tải nhanh trên mạng di động;
- một cá nhân có thể viết, kiểm tra và xuất bản;
- mini tool chạy ngay trên trình duyệt;
- triển khai trên Cloudflare mà không cần VPS, backend, database hay tài khoản người dùng ở V1.

## 2. Stack đã chốt

- **Astro 7**: sinh HTML tĩnh, chỉ tải JavaScript ở nơi có tương tác.
- **Markdown/MDX Content Collections**: quản lý bài viết bằng Git, kiểm tra frontmatter bằng schema.
- **TypeScript**: dùng cho cấu hình, data và logic tool.
- **CSS thuần**: không thêm UI framework; giảm dependency và giữ nhận diện riêng.
- **Cloudflare Workers Static Assets**: phục vụ thư mục `dist/`, không có Worker script hoặc runtime binding.
- **localStorage**: chỉ lưu dữ liệu cục bộ như lịch sử GPA, tùy chọn Pomodoro hoặc ngân sách. Không coi đây là dữ liệu đồng bộ.

## 3. Information Architecture

Header desktop chỉ giữ các điểm vào quan trọng nhất:

1. Logo về Trang chủ
2. Cẩm nang — mở mega menu mười chủ đề
3. Công cụ
4. Về chúng tôi
5. Liên hệ

`Sinh viên IT` và `Lộ trình` vẫn là các route độc lập nhưng không nằm trong header desktop. Chúng được dẫn từ nội dung liên quan và footer để điều hướng chính không cạnh tranh với định vị Cẩm nang sinh viên. `Về chúng tôi` và `Liên hệ` có mặt nhất quán trên desktop, mobile và footer.

Website hiện có mười chủ đề nội dung khởi tạo:

1. Học tập & thi cử
2. Kỹ năng máy tính
3. Kỹ năng mềm & giao tiếp
4. Tiếng Anh
5. Quản lý bản thân
6. Cuộc sống sinh viên
7. Nghiên cứu & xử lý thông tin
8. Nghề nghiệp & chuẩn bị đi làm
9. AI cho sinh viên
10. Công cụ & phần mềm hữu ích

Nguồn dữ liệu chuẩn của chủ đề là `src/data/categories.ts`. Header mega menu, footer, trang chủ, bộ lọc, trang chủ đề, metadata và schema bài viết đều đọc từ nguồn này; không tạo danh sách chủ đề riêng trong component. Số lượng chủ đề không bị hard-code: CMS local có thể thêm, sửa và xóa cấu hình trong chính nguồn này.

Mỗi category có thể khai báo `groups` tùy chọn trong cùng nguồn dữ liệu. Page `/chu-de/[slug]/` dùng một render flow chung: category có group sinh navigation anchor và các section theo cấu hình; category không có group giữ danh sách bài phẳng. Article chỉ lưu `group` và `articleOrder`, còn title, mô tả và thứ tự group thuộc category config; không có component hoặc field `stage` riêng cho Học tập & thi cử.

Ba landing page chính (`/`, `/cam-nang/`, `/cong-cu/`) dùng chung `HeroPicture.astro`. Mỗi trang có một ảnh WebP desktop và một ảnh WebP mobile trong `public/media/page-heroes/`; phần tử `<picture>` chỉ tải nguồn phù hợp với viewport. Ảnh category dùng cho article vẫn nằm riêng trong `public/media/category-heroes/`.

`Sinh viên IT` là một hub chuyên sâu dùng lại nội dung chung, sau đó phân nhánh theo nền tảng và hướng nghề nghiệp; không sao chép bài chỉ để thêm cụm “cho sinh viên IT”.

## 4. Route

| Route | Vai trò |
| --- | --- |
| `/` | Điểm vào theo nhu cầu và mười chủ đề |
| `/cam-nang/` | Danh mục toàn bộ bài viết, có lọc client-side |
| `/cam-nang/[slug]/` | Trang bài viết chuẩn hóa |
| `/chu-de/[slug]/` | Trang chủ đề và cụm nội dung |
| `/cong-cu/` | Danh mục mini tool |
| `/cong-cu/tinh-gpa/` | GPA Calculator |
| `/cong-cu/diem-cuoi-ky/` | Final Grade Calculator |
| `/cong-cu/pomodoro/` | Pomodoro học tập |
| `/cong-cu/chia-nhom/` | Chia nhóm ngẫu nhiên |
| `/cong-cu/ngan-sach-sinh-vien/` | Lập ngân sách tháng |
| `/sinh-vien-it/` | Hub và lộ trình IT |
| `/lo-trinh/` | Lộ trình phát triển sản phẩm/nội dung công khai |
| `/gioi-thieu/` | Nguyên tắc biên tập, nguồn và affiliate disclosure |
| `/lien-he/` | Góp ý nội dung, báo lỗi và hợp tác; tạm `noindex` cho tới khi có kênh liên hệ thật |

## 5. Luồng nội dung

```text
Search intent / pain point
  -> Bài giải thích và các bước thực hiện
  -> Checklist / ví dụ / công cụ liên quan
  -> Bài tiếp theo trong cùng cluster
  -> Trang chủ đề hoặc hub chuyên sâu
```

Mỗi bài có tối đa ba CTA có ích: mở tool, tải/check checklist, đọc bước kế tiếp. Affiliate chỉ xuất hiện khi có purchase intent tự nhiên và phải có nhãn minh bạch.

## 6. Rendering và JavaScript

- Tất cả nội dung và route được prerender thành HTML.
- Header, card, breadcrumb và article layout không cần hydration.
- Mini tool dùng script nhỏ, cô lập theo từng trang.
- Bộ lọc bài viết chạy client-side nhưng danh sách đầy đủ vẫn có trong HTML để người dùng và crawler đọc được.
- Trang chủ đề render cùng một danh sách bài và mặc định trình bày dạng list gọn; nút `Danh sách`/`Dạng thẻ` chỉ đổi class hiển thị client-side, không nhân đôi nội dung và không lưu trạng thái.
- Với category có group, navigation dùng link hash thật và từng section có `scroll-margin-top`; CSS `scroll-behavior` chung xử lý cuộn mượt, không cần JavaScript riêng. Category không có group không render navigation/section rỗng.
- Không dùng SPA routing.

## 7. SEO và metadata

- Mỗi route có `title`, `description`, canonical URL và Open Graph cơ bản.
- Bài viết sinh JSON-LD kiểu `Article`; breadcrumb sinh `BreadcrumbList`.
- `sitemap-index.xml` được sinh trong build; `robots.txt` cho phép crawl.
- URL dùng tiếng Việt không dấu, ngắn, ổn định và có trailing slash.
- Ngày `updatedDate` chỉ thay đổi khi nội dung được kiểm tra/cập nhật thực sự.

## 8. Accessibility và UX

- Mobile-first; nội dung chính không bị che bởi hero hoặc quảng cáo.
- Có skip link, landmark, focus state, label cho input, thông báo kết quả bằng `aria-live`.
- Cỡ chữ nội dung tối thiểu 1rem, vùng bấm tối thiểu khoảng 44px.
- Tôn trọng `prefers-reduced-motion`.
- Tool chấp nhận bàn phím, xử lý input sai và không dựa riêng vào màu sắc.

## 9. Bảo mật và riêng tư

- V1 không thu thập thông tin cá nhân, không có login, form gửi server hoặc secret.
- Dữ liệu tool ở `localStorage` chỉ nằm trên thiết bị; trang tool phải nói rõ điều này.
- Link ngoài dùng thuộc tính phù hợp; affiliate được gắn nhãn `sponsored` khi có.
- Không thêm analytics trước khi có chính sách riêng tư và lựa chọn công cụ đã được duyệt.

## 10. Ranh giới mở rộng

- Chỉ cân nhắc D1/KV khi có một use case cần đồng bộ đa thiết bị hoặc dữ liệu cộng đồng đã được xác thực.
- CMS local chỉ được thêm khi quy trình Markdown + Git trở thành bottleneck đo được; CMS không được xuất hiện trong production build.
- Không đặt LMS logic trong lớp giao diện; nếu có khóa học sau này, tách thành module/dịch vụ riêng.
- Không tạo app mobile hoặc tài khoản chỉ để tăng “độ lớn” của sản phẩm.

## 11. CMS local

CMS biên tập bài viết được tách hoàn toàn trong `cms/` và chỉ chạy bằng `npm run cms` trên loopback `127.0.0.1:4310`. Đây là một Vite client dùng Tiptap Vanilla và một Node server nhỏ chỉ thao tác file; không thêm React/Vue, database, login hay backend production.

Luồng dữ liệu:

```text
CMS local
  -> đọc/ghi taxonomy trong vùng được đánh dấu của src/data/categories.ts
  -> đọc/ghi frontmatter + Markdown trong src/content/articles/
  -> lưu ảnh bài viết trong public/media/articles/<slug>/
  -> Astro dev render route /cam-nang/<slug>/ để preview
  -> khi xuất bản: validate -> kiểm tra Git -> stage đúng file -> commit -> push
  -> Cloudflare tự deploy từ GitHub như hiện tại
```

Server CMS giới hạn request về local origin, xác thực category/slug, chặn đường dẫn thoát khỏi content root và dùng version của file để tránh ghi đè khi bài đã đổi bên ngoài CMS. Astro chỉ đưa draft vào `getStaticPaths()` trong DEV; production build vẫn loại draft.

Màn hình danh sách CMS dùng cây `Category -> Groups tùy chọn -> Articles`: chọn category hoặc group sẽ lọc bài tương ứng. Người vận hành có thể thêm/sửa/xóa category và group; ID đã tạo được khóa để tránh làm gãy URL/frontmatter. CMS chặn xóa category/group còn được bài viết tham chiếu và chặn xóa category còn được mini tool dùng.

Form bài viết đọc `groups` từ category config qua API local. Khi category có group, CMS hiện dropdown bắt buộc; khi không có group, control được ẩn và bài giữ danh sách phẳng. `articleOrder` là số nguyên dương tùy chọn và được round-trip qua frontmatter.

Danh sách mini tool có nguồn chuẩn tại `src/data/tools.ts`; website re-export qua `src/data/site.ts`, còn CMS server đọc trực tiếp module dữ liệu này nên client không hard-code route. Field `tool` và `sources` được round-trip qua frontmatter; server kiểm tra route nội bộ của tool và chỉ chấp nhận URL nguồn dùng `http/https`.

Dependency CMS nằm ở `devDependencies` và không được import từ source website, vì vậy mã editor/server không nằm trong bundle hoặc static assets production.

Typography của website và CMS dùng chung Noto Sans variable tự host trong `public/fonts/noto-sans/`. CSS nguồn nằm tại `src/styles/fonts.css`; CMS cấu hình Vite `publicDir` trỏ tới `public/` để dùng đúng cùng asset, không gọi Google Fonts khi chạy local hoặc production.

Article dùng hero ảnh toàn chiều ngang, cao khoảng nửa viewport, với title và metadata đặt trên lớp phủ. Mỗi category khai báo một `heroImage` mặc định trong nguồn taxonomy chung; `thumbnail` của article ghi đè ảnh này khi có. Cách fallback này giữ giao diện đồng nhất mà không buộc người vận hành chuẩn bị ảnh riêng cho mọi bài.

Mẫu quảng cáo trong article chỉ hoạt động ở môi trường local: markup được chèn ngay lúc render, không cần client JavaScript. Bài có từ ba H2 nhận một slot trước H2 thứ ba và một slot cuối bài trước related articles; bài ngắn chỉ có slot cuối. Production build không chứa placeholder hoặc script quảng cáo. Khi có nhà cung cấp thật mới thay nội dung slot, thêm disclosure/consent cần thiết và mở cấu hình production.

Publish là quy trình hai bước: bước chuẩn bị bắt buộc repository không có staged file, merge/rebase dở dang hoặc thay đổi ngoài phạm vi hiện tại; sau validation, CMS hiển thị branch, remote và danh sách file chính xác. Publish bài chỉ được stage bài/media liên quan; publish cấu trúc chỉ được stage `src/data/categories.ts`. Chỉ khi người vận hành xác nhận, CMS mới commit và chạy `git push origin <branch>`; không có force push.

Gỡ bài dùng lại đúng pipeline publish nhưng lưu `draft: true`, vì vậy production mất route sau khi Cloudflare build lại trong khi file nguồn vẫn còn. Xóa bài là workflow riêng có hai lần xác nhận: người vận hành phải nhập đúng slug, CMS liệt kê file dự kiến, rồi mới chuyển file bài (và thư mục media nếu được chọn) vào `.cms-trash/`, chạy validation, stage deletion, commit và push. `.cms-trash/` bị Git ignore để giữ bản phục hồi trên máy mà không đưa bản sao lên repository.
