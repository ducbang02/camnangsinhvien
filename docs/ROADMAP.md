# Roadmap — Cẩm nang sinh viên

## Trạng thái hiện tại

**Phase 1 — MVP đã deploy production.** Kiến trúc đã chốt ngày 14/09/2026: Astro + Markdown/MDX + Cloudflare Workers Static Assets, không backend/database/login. Validation, route scan, internal-link scan, browser QA local và production smoke test đã đạt; xem `docs/TESTING.md`.

**Phase 1A — kiến trúc 10 chủ đề đã được duyệt local.** Mô hình ba nhóm nội dung ban đầu đã được thay bằng mười chủ đề dùng chung một nguồn `src/data/categories.ts`. Đã bổ sung 7 bài mẫu ngắn để mọi chủ đề có ít nhất 2 bài; website hiện có 27 bài. Chưa push hoặc deploy thay đổi này lên production.

**Phase 1B — CMS local Phase 1 đã hoàn tất.** CMS Tiptap Vanilla có danh sách/search/filter, editor, metadata theo Content Collection, load/save Markdown/MDX và preview bằng layout Astro thật. CMS không có database/login, chỉ bind local và không được đưa vào production build. Xem `docs/CMS.md`.

**Điều hướng chính đã được tinh gọn.** Header desktop chỉ giữ mega menu `Cẩm nang` và liên kết `Công cụ`. Hub `Sinh viên IT` và trang `Lộ trình` vẫn tồn tại nhưng được dẫn từ nội dung/footer, tránh làm loãng định vị của website.

**Article hero đã chuyển sang layout ưu tiên hình ảnh.** Title và metadata nằm trên hero cao khoảng nửa viewport; mười category có ảnh mặc định tự host và article vẫn có thể ghi đè bằng thumbnail riêng từ CMS.

**Landing page chính có hero image responsive.** Trang chủ, Cẩm nang và Công cụ dùng `HeroPicture.astro` với ảnh WebP desktop/mobile riêng trong `public/media/page-heroes/`; trình duyệt chọn nguồn theo viewport để giữ đúng bố cục mà không tải cả hai ảnh.

**Danh sách bài trong từng chủ đề đã được tinh gọn.** Mặc định bài hiển thị theo list một cột gồm title, mô tả ngắn và thời gian đọc; người đọc có thể chuyển sang lưới card ngay trên trang mà không tải lại hoặc nhân đôi nội dung.

**Điều hướng thông tin và mẫu quảng cáo đã được chuẩn bị local.** Header có thêm `Về chúng tôi` và `Liên hệ`; route Liên hệ đang dùng nội dung mẫu và `noindex` cho tới khi có email thật. Article có tối đa hai placeholder quảng cáo local để duyệt vị trí, chưa tích hợp ad network và production không render placeholder.

**CMS Phase 2 — đã hoàn tất local, chờ duyệt giao diện.** CMS đã có upload ảnh/thumbnail vào repository, alt/caption, YouTube block và workflow validate → liệt kê đúng file → stage chọn lọc → commit → push không force. Publish được kiểm thử end-to-end bằng Git repository/remote tạm; trên repository thật chỉ smoke test nhánh cảnh báo, không tạo commit hoặc push ngoài yêu cầu. Hạng mục này tách biệt với “Phase 2 — Có traffic ban đầu” của roadmap sản phẩm.

**Metadata CTA và nguồn đã có thể biên tập trong CMS.** Người vận hành chọn mini tool từ nguồn dữ liệu chung, thêm/xóa/sửa nguồn tham khảo và xem title đầy đủ trong editor; không cần sửa frontmatter thủ công cho các field này.

**Vòng đời bài viết đã được quản lý trong CMS.** Nút xuất bản nói rõ workflow Git/Cloudflare; bài có thể được gỡ bằng cách push trạng thái Draft hoặc xóa qua xác nhận slug, thùng rác local và commit/push chọn lọc. Media chỉ bị xóa khi người vận hành chủ động chọn.

Repository và local `origin` đã chuyển sang `ducbang02/camnangsinhvien`. Cloudflare Workers Builds theo dõi nhánh `main` và deploy Worker `cam-nang-sinh-vien` tại `https://cam-nang-sinh-vien.nguyenducbang-uit.workers.dev/`.

## Nguyên tắc ưu tiên

- **P0 — phải làm:** tạo giá trị ngay, đo được, ít dependency.
- **P1 — nên làm:** triển khai khi P0 đã có traffic và dữ liệu hành vi.
- **P2 — để sau:** chỉ đầu tư khi có tín hiệu nhu cầu rõ.
- **Không làm hiện tại:** phức tạp hơn giá trị hoặc làm loãng định vị.

## Phase 1 — MVP (P0)

Mục tiêu: một hub có thể xuất bản thật, không phải landing page minh họa.

- Mười trang chủ đề, mega menu, hub Sinh viên IT và danh mục bài viết.
- 20 bài mở đầu và 7 bài mẫu bổ sung tạo thành các đường đi hoàn chỉnh, ưu tiên GPA, phương pháp học, kỹ năng số/AI, năm nhất/chi tiêu và nền tảng IT.
- 5 mini tool: GPA, điểm cuối kỳ, Pomodoro, chia nhóm và ngân sách tháng.
- Content schema, article layout, nguồn tham khảo, internal link, sitemap, robots và trang 404.
- Mobile-first, keyboard-accessible và browser QA.
- Cloudflare Workers Static Assets config; deploy sau khi người dùng có/cho phép kết nối tài khoản.

Tiêu chí hoàn thành:

- validation và production build thành công;
- mọi route chính trả về 200, route sai trả về 404;
- năm tool xử lý được happy path, input sai và thao tác reset;
- không có horizontal overflow ở viewport 390px;
- người dùng đi từ bài “Cách tính GPA” sang calculator trong một thao tác rõ ràng.

## Phase 2 — Có traffic ban đầu (P1)

Điều kiện vào phase: website đã index, có ít nhất 8–12 tuần dữ liệu Search Console.

- Mở rộng 5 cluster dựa trên impression/query thật, không dựa vào số lượng bài.
- Thêm Typing Test/Trainer nếu cụm gõ 10 ngón có impression.
- Tạo template tải về nhẹ: semester planner, checklist năm nhất, bảng chi tiêu.
- Thêm analytics tôn trọng riêng tư sau khi có privacy policy và consent phù hợp.
- Thử 3–5 affiliate card ở bài có purchase intent cao; đo outbound click và phản hồi.
- Thiết lập quy trình rà soát bài phần mềm theo `reviewedAt`.

## Phase 3 — Scale content (P1/P2)

- Mở rộng cluster thắng trong mười chủ đề đã chốt thay vì tạo thêm chủ đề tùy ý.
- Bổ sung roadmap tương tác cho Sinh viên IT và kỹ năng số.
- Xây kho tài nguyên có tiêu chí chọn, ngày kiểm tra và nguồn rõ ràng.
- Content QA: độ chính xác, trùng intent, orphan page, liên kết gãy, nội dung lỗi thời.
- Cân nhắc search tĩnh khi số bài vượt khoảng 80–100 và dữ liệu cho thấy người dùng cần.

## Phase 4 — Monetization (P2)

- Affiliate tự nhiên ở cụm đồ dùng, góc học tập, laptop/phụ kiện và phần mềm phù hợp.
- Template premium hoặc khóa học nhỏ chỉ khi nội dung miễn phí đã chứng minh nhu cầu.
- Display Ads sau cùng, với giới hạn vị trí để không phá Core Web Vitals và trải nghiệm đọc.
- Sponsorship phải có tiêu chuẩn biên tập và disclosure độc lập.

## Phase 5 — Student Platform (P2)

Chỉ bắt đầu khi có returning users và nhu cầu đồng bộ được chứng minh:

- tài khoản tùy chọn;
- đồng bộ planner/progress;
- lộ trình cá nhân hóa;
- cộng đồng hoặc đóng góp có moderation;
- cân nhắc D1/KV/R2 theo use case cụ thể.

## Không làm hiện tại

- Admin/CMS tùy biến, mobile app, LMS, forum, chat AI hoặc social network.
- Login chỉ để lưu các giá trị có thể giữ bằng localStorage.
- AI-generated content hàng loạt.
- Tạo đủ 20 tool trước khi tool hiện tại có usage.
- Nhét affiliate vào bài không có purchase intent.

## Thứ tự 20 bài đầu

1. Cách tính GPA đại học — intent rõ, nối trực tiếp GPA Calculator.
2. Điểm cuối kỳ cần bao nhiêu — pain point sát kỳ thi, nối Final Grade Calculator.
3. Lập kế hoạch học kỳ trong 30 phút — hub cho deadline và Pomodoro.
4. Active Recall: học bằng cách tự nhớ — phương pháp nền tảng, dễ thực hành.
5. Spaced Repetition cho sinh viên — cặp cluster với Active Recall.
6. Ôn thi trong 7 ngày — intent cấp bách, dùng lại planner.
7. Dùng AI để học mà không copy đáp án — định vị đạo đức và khác biệt.
8. Kiểm chứng câu trả lời của AI — nối research/fact-checking.
9. Kỹ năng máy tính cần biết trước tốt nghiệp — bài gateway của chủ đề Kỹ năng máy tính.
10. Quản lý file và đặt tên file — pain point phổ quát, dễ hành động.
11. Bảo vệ tài khoản sinh viên — giá trị cao, không phụ thuộc ngành.
12. Gõ 10 ngón bắt đầu từ đâu — chuẩn bị cluster Typing Trainer P1.
13. Tân sinh viên cần chuẩn bị gì — seasonal và có checklist.
14. Lập ngân sách tháng cho sinh viên — nối Budget Planner.
15. Ở trọ lần đầu cần chuẩn bị gì — purchase intent tự nhiên.
16. Laptop cho sinh viên: chọn theo nhu cầu — commercial investigation có tiêu chí.
17. Viết email cho giảng viên — tình huống lặp lại và shareable.
18. Làm việc nhóm khi có người không làm — pain point thực tế, nối tool chia nhóm.
19. Sinh viên IT nên học gì trước — gateway cho hub IT.
20. Project đầu tiên cho sinh viên IT — đáp ứng khoảng trống giữa môn học và thực tế.
