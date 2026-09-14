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

Menu cấp một giữ ở mức sáu mục:

1. Trang chủ
2. Cẩm nang
3. Công cụ
4. Sinh viên IT
5. Lộ trình
6. Giới thiệu

Ba trụ cột nội dung:

1. **Học tập & phát triển bản thân**: phương pháp học, quản lý thời gian, research, tiếng Anh học thuật và kỹ năng giao tiếp trong môi trường đại học.
2. **Kỹ năng số & công cụ**: máy tính, phần mềm, an toàn số, AI và workflow số. AI là lớp nội dung xuyên suốt, không tách thành pillar riêng ở V1.
3. **Cuộc sống sinh viên**: năm nhất, ở trọ, chi tiêu, đồ dùng, thực tập và chuẩn bị đi làm.

`Sinh viên IT` là một hub chuyên sâu dùng lại nội dung chung, sau đó phân nhánh theo nền tảng và hướng nghề nghiệp; không sao chép bài chỉ để thêm cụm “cho sinh viên IT”.

## 4. Route

| Route | Vai trò |
| --- | --- |
| `/` | Điểm vào theo nhu cầu và ba trụ cột |
| `/cam-nang/` | Danh mục toàn bộ bài viết, có lọc client-side |
| `/cam-nang/[slug]/` | Trang bài viết chuẩn hóa |
| `/chu-de/[slug]/` | Pillar page và cụm nội dung |
| `/cong-cu/` | Danh mục mini tool |
| `/cong-cu/tinh-gpa/` | GPA Calculator |
| `/cong-cu/diem-cuoi-ky/` | Final Grade Calculator |
| `/cong-cu/pomodoro/` | Pomodoro học tập |
| `/cong-cu/chia-nhom/` | Chia nhóm ngẫu nhiên |
| `/cong-cu/ngan-sach-sinh-vien/` | Lập ngân sách tháng |
| `/sinh-vien-it/` | Hub và lộ trình IT |
| `/lo-trinh/` | Lộ trình phát triển sản phẩm/nội dung công khai |
| `/gioi-thieu/` | Nguyên tắc biên tập, nguồn và affiliate disclosure |

## 5. Luồng nội dung

```text
Search intent / pain point
  -> Bài giải thích và các bước thực hiện
  -> Checklist / ví dụ / công cụ liên quan
  -> Bài tiếp theo trong cùng cluster
  -> Pillar page hoặc hub chuyên sâu
```

Mỗi bài có tối đa ba CTA có ích: mở tool, tải/check checklist, đọc bước kế tiếp. Affiliate chỉ xuất hiện khi có purchase intent tự nhiên và phải có nhãn minh bạch.

## 6. Rendering và JavaScript

- Tất cả nội dung và route được prerender thành HTML.
- Header, card, breadcrumb và article layout không cần hydration.
- Mini tool dùng script nhỏ, cô lập theo từng trang.
- Bộ lọc bài viết chạy client-side nhưng danh sách đầy đủ vẫn có trong HTML để người dùng và crawler đọc được.
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
- Chỉ làm admin UI khi quy trình Markdown + Git trở thành bottleneck đo được.
- Không đặt LMS logic trong lớp giao diện; nếu có khóa học sau này, tách thành module/dịch vụ riêng.
- Không tạo app mobile hoặc tài khoản chỉ để tăng “độ lớn” của sản phẩm.
