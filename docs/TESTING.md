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

## Smoke test publish từ GitHub lên Cloudflare — 14/09/2026

- Local `origin` đã đổi sang `https://github.com/ducbang02/camnangsinhvien.git`.
- Commit CMS Phase 1: `66b5894`.
- Commit bài Published `test-cms123`: `3eaed0e`.
- Push `main` thành công; Cloudflare Workers Build `#76c3243e` nhận đúng commit `3eaed0e` và hoàn tất trong 49 giây.
- Production route `/cam-nang/test-cms123/` chuyển từ 404 sang 200 sau deploy.
- Browser smoke test production xác nhận title, breadcrumb, mục lục, nội dung, bảng, checklist, related articles và footer hiển thị đúng.
