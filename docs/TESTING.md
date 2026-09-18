# Báo cáo kiểm thử MVP

Ngày kiểm thử: 14/09/2026.

## Production smoke test — 14/09/2026

URL: `https://cam-nang-sinh-vien.nguyenducbang-uit.workers.dev/`

- Cloudflare Workers Builds hoàn tất đủ các bước initialize, clone, install, build và deploy.
- Trang chủ trả `200 OK`; canonical và JSON-LD dùng đúng URL production.
- `robots.txt` trả `200 OK` và trỏ đúng `sitemap-index.xml` production.
- `sitemap-index.xml` trả `200 OK` và trỏ đúng `sitemap-0.xml` production.
- URL không tồn tại trả `404 Not Found` và hiển thị trang 404 tùy chỉnh.
- Security headers có `x-content-type-options`, `x-frame-options`, `referrer-policy`, `permissions-policy` và `cross-origin-opener-policy`.
- GPA Calculator với 3 tín chỉ × 3.0, 3 tín chỉ × 4.0, 2 tín chỉ × 2.5 trả `3.25`.
- Final Grade Calculator với điểm quá trình 7.5, trọng số cuối kỳ 60% và mục tiêu 8.0 trả `8.33`.
- Giao diện production tải đúng CSS, điều hướng và nội dung tiếng Việt.

## Local validation — kiến trúc 10 trụ cột

- `npm run validate`: đạt, `astro check` có 0 error, 0 warning, 0 hint.
- Production build sau khi bổ sung nội dung sinh 49 trang tĩnh: 27 bài, đủ 10 route `/chu-de/[slug]/`, các tool và route nền tảng.
- Trang chủ và mega menu đều lấy đủ 10 trụ cột từ `src/data/categories.ts`.
- Bộ lọc Cẩm nang có đủ 10 giá trị `data-filter`; card bài viết dùng `data-category` mới.
- 13 route đại diện trên local trả `200`: trang chủ, Cẩm nang, bài GPA và đủ 10 trang trụ cột.
- Bài GPA có breadcrumb trỏ về `hoc-tap-thi-cu`, Open Graph loại `article`, Twitter metadata và JSON-LD `articleSection`.
- Ba URL trụ cột cũ có redirect `301` trong `public/_redirects` để Cloudflare giữ liên kết sau lần deploy kế tiếp.
- Đã bổ sung 7 bài mẫu để mỗi trụ cột có ít nhất 2 bài. Phân bổ hiện tại: Học tập & thi cử 5; Kỹ năng máy tính 5; Cuộc sống sinh viên 3; bảy trụ cột còn lại 2 bài mỗi trụ cột.
- Cả 7 route bài mẫu trả `200` trên local và có JSON-LD `articleSection`.
- Tab local đã mở tại `http://127.0.0.1:4321/cam-nang/`. Quyền điều khiển trình duyệt bị hệ thống từ chối ở lượt kiểm tra này nên chưa thể ghi nhận click/resize tự động cho giao diện mới.

## Automated validation

- `astro check`: 0 error, 0 warning, 0 hint.
- Production build: 35 trang tĩnh, có `sitemap-index.xml` và `robots.txt`.
- Route smoke test: 34 route trong sitemap trả 200; URL không tồn tại trả 404.
- Internal link scan trên output: 0 link nội bộ gãy.
- `wrangler deploy --dry-run`: đọc thành công 77 static asset, không có binding.

## Browser QA MVP trước khi chuyển sang 10 trụ cột

Đã kiểm tra trên Chrome ở desktop và viewport mobile 390 × 800:

- Trang chủ: hero, CTA, quick board, ba pillar, tool card và hub IT hiển thị đúng.
- Menu mobile: mở được, đủ bốn mục chính và Giới thiệu.
- Cẩm nang: tìm “GPA” còn một bài; lọc Kỹ năng số còn tám bài; empty state hoạt động.
- Bài GPA: breadcrumb, metadata, mục lục và nội dung dễ đọc trên mobile.
- GPA Calculator: dữ liệu mẫu trả 3.25; điểm 5/4 hiện cảnh báo; history lưu local.
- Final Grade Calculator: mẫu 7.5, 60%, mục tiêu 8 trả 8.33; mục tiêu bất khả thi trả cảnh báo 20/10.
- Pomodoro: sau khi đổi thời lượng thành một phút, bắt đầu ở 01:00; task, pause và reset hoạt động.
- Chia nhóm: sáu người thành hai nhóm, mỗi nhóm ba; số nhóm 7 trả cảnh báo.
- Ngân sách: dữ liệu mẫu còn 1.900.000đ/tháng, khoảng 441.860đ/tuần; trường hợp âm hiển thị thiếu 1.600.000đ.
- GPA mobile: bảng chuyển thành card, không còn document overflow ngang.
- Hub Sinh viên IT: hero, terminal card, lộ trình và navigation hiển thị đúng desktop.
- Header desktop: chỉ hiển thị `Cẩm nang` và `Công cụ`; mega menu mở đủ 10 trụ cột. `Sinh viên IT` và `Lộ trình` không còn trong header nhưng vẫn truy cập được từ nội dung/footer.
- CMS Phase 2: 9 test tự động đạt, gồm round-trip ảnh/YouTube, kiểm tra file ảnh, publish commit/push vào remote tạm và chặn thay đổi không liên quan.
- Media preview trên Astro dev: figure có alt/caption và iframe YouTube hiển thị đúng, không có horizontal overflow; dữ liệu smoke test đã được xóa sau khi kiểm tra.
- Publish trên repository thật đang có thay đổi: CMS hiển thị đúng danh sách file không liên quan và dừng trước khi save/stage/commit.
- Console sau các lượt kiểm tra đại diện: không có error/warning.

## Lỗi đã phát hiện và sửa

1. Pomodoro có thể giữ thời lượng cũ nếu người dùng sửa input rồi bấm Start ngay. Đã chuyển cập nhật thời lượng sang sự kiện `input` và kiểm tra lại 01:00.
2. Bảng GPA có overflow ngang ở 390px. Đã chuyển mỗi dòng thành card trên màn hình nhỏ và xác nhận `scrollWidth` không vượt chiều rộng document.

## Trạng thái production

Production hiện tại vẫn là bản trước khi chuyển sang 10 trụ cột. Không push hoặc deploy thay đổi giao diện trong lượt này; chỉ deploy sau khi giao diện local được duyệt.


test dong moi
# Kiểm thử CMS local

Ngày 14/09/2026, CMS Phase 1 đã được kiểm tra theo ba lớp:

- `npm run test:cms`: 4/4 test pass; tạo/đọc/cập nhật Markdown trong thư mục tạm, giữ table/checklist, từ chối stale write/path không hợp lệ và chặn slug trùng route.
- Browser QA tại `http://127.0.0.1:4310/`: tải đủ 27 bài, search hoạt động, mở bài cũ nạp đúng metadata và nội dung, tạo bài nháp bằng form/editor, toolbar H2/checklist/table hoạt động.
- Ô `Tiêu đề bài viết` có label, khung và chiều cao tối thiểu để không bị nhầm với H2 đầu tiên trong nội dung.
- Preview thật: CMS lưu bài draft rồi mở thành công route Astro `/cam-nang/<slug>/`; trang có header, breadcrumb, metadata, article layout, related articles và footer giống website. File test thủ công đã được xóa sau khi kiểm tra.

CMS Phase 1 không thực hiện commit/push. Danh sách kiểm tra đầy đủ cho người vận hành nằm trong `docs/CMS.md`.

## Kiểm thử typography Noto Sans

- Website public và CMS local cùng tải Noto Sans variable từ `public/fonts/noto-sans/`, không phụ thuộc Google Fonts ở runtime.
- Kiểm tra các chuỗi tiếng Việt có đủ dấu ở heading, nội dung bài viết, menu, form metadata và editor.
- Code block, đường dẫn file và terminal vẫn giữ font monospace để dễ đọc.
- Ngày 16/09/2026: `npm run validate` đạt với 0 error, 0 warning, 0 hint và build đủ 51 trang.
- `npm run test:cms` đạt 9/9 test; `wrangler deploy --dry-run` đọc thành công 118 static asset, không có binding.
- Browser QA xác nhận trang chủ desktop/mobile, danh sách CMS và editor đều dùng Noto Sans đã tải xong; không có console error/warning và không có overflow ngang ở viewport mobile.

## Smoke test publish từ GitHub lên Cloudflare — 14/09/2026

- Local `origin` đã đổi sang `https://github.com/ducbang02/camnangsinhvien.git`.
- Commit CMS Phase 1: `66b5894`.
- Commit bài Published `test-cms123`: `3eaed0e`.
- Push `main` thành công; Cloudflare Workers Build `#76c3243e` nhận đúng commit `3eaed0e` và hoàn tất trong 49 giây.
- Production route `/cam-nang/test-cms123/` chuyển từ 404 sang 200 sau deploy.
- Browser smoke test production xác nhận title, breadcrumb, mục lục, nội dung, bảng, checklist, related articles và footer hiển thị đúng.

## Kiểm thử article hero theo trụ cột — 16/09/2026

- `npm run validate` đạt: `astro check` có 0 error, 0 warning, 0 hint và production build đủ 51 trang.
- `npm run deploy:dry` đọc thành công 130 static asset, không có binding và không deploy thật.
- `npm run test:cms` đạt 9/9 test; thay đổi gợi ý thumbnail không làm ảnh hưởng quy trình đọc, lưu và publish Markdown.
- `wrangler deploy --dry-run` đọc thành công 130 static asset, không có binding và không thực hiện deploy thật.
- 10 ảnh hero mặc định được tối ưu thành WebP 1536 × 864, tổng dung lượng khoảng 900 KB; mỗi trụ cột lấy ảnh từ cùng nguồn `src/data/categories.ts`.
- Desktop: route `/cam-nang/active-recall-la-gi/` hiển thị hero cao 50vh, ảnh tải đúng 1536 × 864, tiêu đề và metadata dễ đọc trên lớp phủ tối.
- Mobile: kiểm tra ở viewport 390 × 800, hero chuyển về chiều cao tối thiểu 400px, breadcrumb có thể xuống dòng và trang không bị overflow ngang.
- Đã mở một bài đại diện thuộc từng trụ cột; cả 10 ảnh mặc định đều tải thành công, đúng category và không có console error/warning.
- Ảnh `thumbnail` riêng của bài (khi có) được ưu tiên; bài không có thumbnail tự dùng ảnh mặc định của trụ cột. Ảnh mặc định có `alt=""` vì chỉ mang tính trang trí và tiêu đề đã xuất hiện ngay trong hero.

## Kiểm thử điều hướng thông tin và mẫu quảng cáo — 16/09/2026

- `npm run validate` đạt: 0 error, 0 warning, 0 hint và production build đủ 52 trang.
- `npm run test:cms` đạt 9/9; `wrangler deploy --dry-run` đọc thành công 132 static asset và không deploy thật.
- Article hero title có cỡ tối đa `3.8rem` (60.8px ở desktop), giảm từ 4.8rem.
- Header desktop hiển thị `Cẩm nang`, `Công cụ`, `Về chúng tôi`, `Liên hệ`; cả hai route thông tin có active state đúng và footer có đủ liên kết.
- Route `/lien-he/` hiển thị ba nhóm nhu cầu, trạng thái chờ thông tin thật, có `noindex,follow` và được loại khỏi sitemap trong thời gian là trang mẫu.
- Bài có ít nhất ba H2 hiển thị đúng hai slot mẫu: slot giữa bài nằm trước H2 thứ ba, slot cuối nằm trước related articles. Bài ngắn không có H2 chỉ hiển thị slot cuối.
- Placeholder quảng cáo chỉ tồn tại khi chạy local; production build không chứa nhãn mẫu hoặc script đặt slot.
- Browser QA desktop và mobile 500 × 800 xác nhận điều hướng, trang Liên hệ và khung quảng cáo không bị overflow ngang; console không có error/warning.

## Kiểm thử CMS chỉnh công cụ và nguồn tham khảo — 16/09/2026

- `npm run test:cms` đạt 10/10 test; dữ liệu `tool` và `sources` được giữ nguyên sau vòng lưu–mở lại Markdown, đồng thời route công cụ hoặc URL nguồn sai bị từ chối.
- `npm run validate` đạt: `astro check` có 0 error, 0 warning, 0 hint và production build đủ 51 trang.
- Browser QA mở bài `/cam-nang/cach-tinh-gpa-dai-hoc/` trong CMS: trường Công cụ tự chọn đúng `Tính GPA`; nguồn Thông tư hiện có nạp đúng tên và URL.
- Danh sách Công cụ trong CMS có đủ năm công cụ hiện có và lấy từ `src/data/tools.ts`, không hard-code thêm một bản riêng trong client.
- Ô tiêu đề tự giãn thành hai dòng; phép đo thực tế có `clientHeight = scrollHeight = 103px`, nên toàn bộ tiêu đề hiển thị mà không bị cắt.
- Thêm thử một nguồn chỉ có tên rồi bấm Lưu thay đổi: CMS chặn ghi file, đánh dấu đúng nhóm Nguồn tham khảo và báo “Mỗi nguồn tham khảo cần đủ tên hiển thị và URL.” Dòng kiểm thử đã được xóa khỏi form sau đó.
- Không có bài viết thật nào bị sửa trong lượt browser QA này.

## Kiểm thử vòng đời bài viết trong CMS — 16/09/2026

- `npm run test:cms` đạt 12/12 test; test Git remote tạm xác nhận xuất bản, gỡ thành Draft, xóa bài + media, commit và push đúng branch mà không dùng force push.
- Trường hợp nhập sai slug trả `DELETE_CONFIRMATION_MISMATCH`; file bài và media không bị di chuyển.
- Khi xóa thành công trong repository tạm, file bài và thư mục media không còn ở đường dẫn public nhưng vẫn tồn tại dưới `.cms-trash/<timestamp>/` để phục hồi.
- `npm run validate` đạt: `astro check` có 0 error, 0 warning, 0 hint và production build hiện tại sinh 50 trang (hai bài Draft không được build thành route public).
- Browser QA tại CMS local xác nhận nút `Xuất bản lên website`, `Gỡ khỏi website (chuyển Draft)` và `Xóa bài…` hiển thị đúng với bài đã lưu; hai nút quản lý bị disable với bài mới chưa lưu.
- Hộp xóa hiển thị đúng title/path, yêu cầu slug, mặc định không chọn xóa media; nhập slug sai giữ nguyên bài và báo lỗi rõ ràng. Không có bài thật nào bị xóa hoặc push trong browser QA.
- Console CMS không có error hoặc warning.

## Kiểm thử form Liên hệ — 17/09/2026

- `npm run validate` đạt: sinh Worker types, `tsc` cho Worker, `astro check` có 0 error/warning/hint và production build đủ 60 trang.
- `npm run deploy:dry` đọc thành công 161 static asset; Wrangler nhận đúng `EMAIL`, `ASSETS`, ba biến cấu hình public và không in Turnstile secret.
- `npm run test:cms` đạt 17/17 test; thay đổi Worker và form không ảnh hưởng luồng CMS.
- API local trả đúng: `GET /api/contact` 405, cross-origin 403, content type sai 415, payload sai 400, payload quá 16 KiB 413, API không tồn tại 404 và `/lien-he/` 200.
- Payload hợp lệ nhưng token Turnstile giả bị từ chối 403 trước bước gửi email.
- Canonical Siteverify với test key công khai trả `success: true`; test secret mô phỏng replay trả `timeout-or-duplicate`, xác nhận hai nhánh phản hồi của Cloudflare hoạt động như tài liệu.
- Browser QA xác nhận trang Liên hệ hiển thị đủ ba nhóm nhu cầu, thông báo riêng tư, label input, Turnstile và trạng thái validation bằng `aria-live`; submit form rỗng đưa focus về trường Họ và tên và báo lỗi rõ ràng.
- Turnstile widget production đã được tạo cho `localhost`, `127.0.0.1`, hai custom hostname và hostname `workers.dev`; token API tạm đã được thu hồi sau khi tạo widget.
- Cloudflare Email Routing đã xác minh Gmail đích `sunny.contact.251010@gmail.com`; routing rule `lienhe@camnangsinhvien.site` đang `Active` và chuyển tiếp về Gmail này.
- Production smoke test ngày 18/09/2026: rotate Turnstile secret, lưu `TURNSTILE_SECRET` đúng dạng Worker Secret và gửi form thật tại `/lien-he/` thành công. Turnstile Analytics ghi nhận 1 Siteverify request, 1 valid token và 0 invalid token; endpoint chỉ trả thông báo thành công sau khi `EMAIL.send()` hoàn tất.
- Kiểm tra token replay riêng chưa thực hiện vì token production chỉ dùng một lần trong luồng form thật; đây không chặn chức năng gửi liên hệ.

## Kiểm thử chuẩn hóa production — 18/09/2026

- `npm run validate` đạt: Worker types và TypeScript đạt; `astro check` có 0 error/warning/hint; production build sinh 61 trang.
- Build local xác nhận canonical, `robots.txt` và sitemap đều dùng `https://camnangsinhvien.site`.
- Worker local xác nhận `www` và hostname `workers.dev` trả redirect `308`, giữ nguyên path/query và trỏ về domain chuẩn.
- Cloudflare `Always Use HTTPS` đã bật cho toàn zone; biến build `SITE_URL` đã đổi sang `https://camnangsinhvien.site`.
- Bài `/cam-nang/cach-tinh-gpa-dai-hoc/` trả `200`, dùng ảnh chủ đề phù hợp; bài thử `/cam-nang/test-cms123/` trả `404` sau khi xóa.
- Trang `/chinh-sach-quyen-rieng/` có một H1, nội dung giải thích form/Turnstile/localStorage và chỉ được liên kết từ footer.
- Media nhận browser cache bảy ngày; font nhận cache một năm với `immutable`; HTML vẫn dùng revalidation mặc định.
- CSP cho phép cùng origin, Cloudflare Turnstile và iframe `youtube-nocookie.com`; HSTS 30 ngày chỉ được gắn cho domain HTTPS chuẩn.
