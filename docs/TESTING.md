# Báo cáo kiểm thử MVP

Ngày kiểm thử: 14/09/2026.

## Automated validation

- `astro check`: 0 error, 0 warning, 0 hint.
- Production build: 35 trang tĩnh, có `sitemap-index.xml` và `robots.txt`.
- Route smoke test: 34 route trong sitemap trả 200; URL không tồn tại trả 404.
- Internal link scan trên output: 0 link nội bộ gãy.
- `wrangler deploy --dry-run`: đọc thành công 77 static asset, không có binding.

## Browser QA như người dùng thật

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

## Chưa kiểm thử production

Chưa deploy vì chưa có Cloudflare account/Worker target và domain production được xác nhận. Cần chạy smoke test trong `docs/DEPLOYMENT.md` sau khi kết nối.
