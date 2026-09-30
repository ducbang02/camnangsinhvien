# Quy chuẩn trình bày bài viết

Đọc file này trước khi tạo hoặc chuẩn hóa bài. Mục tiêu là Markdown sạch; `ArticleLayout.astro` và `.prose` chịu trách nhiệm trình bày trên desktop/mobile.

## Cấu trúc tối thiểu

- Không viết H1 trong body; tiêu đề bài lấy từ frontmatter/CMS.
- Dùng H2 (`##`) cho section chính. Dùng H3 (`###`) khi H2 thật sự cần chia nhỏ.
- Mở đầu bằng đoạn ngắn đi thẳng vào vấn đề; mỗi đoạn thường 2–4 câu.
- Một bài nên đi theo mạch: vấn đề → cách làm/ví dụ → checklist hoặc bước tiếp theo.
- Ưu tiên Markdown chuẩn; không thêm HTML, class hoặc style riêng nếu CMS đã có block tương ứng.

## Thành phần nội dung

- **Bold:** chỉ nhấn từ khóa hoặc kết luận quan trọng, không bôi đậm cả đoạn.
- *Italic:* dùng tiết chế cho thuật ngữ hoặc sắc thái.
- List: dùng khi có từ ba ý cùng cấp; giữ cấu trúc lồng tối đa khoảng hai tầng.
- Blockquote (`>`): dành cho một ý cần nhớ, cảnh báo hoặc nguyên tắc quan trọng.
- Table: dùng cho so sánh, ánh xạ hoặc dữ liệu có cùng trường; không nhét đoạn văn dài vào ô.
- Checklist (`- [ ]`): phù hợp cho bước tự kiểm tra, thường đặt gần cuối bài.
- Inline code: dùng cho lệnh, tên file, phím hoặc giá trị kỹ thuật ngắn.
- Code block: dùng fenced code block và ghi ngôn ngữ sau ba dấu backtick khi biết, ví dụ `js`.
- Link: dùng nhãn mô tả đích đến; tránh “bấm vào đây” và URL trần quá dài.
- Ảnh: luôn có alt mô tả đúng ngữ cảnh; caption chỉ thêm khi cung cấp thông tin mới.
- Horizontal rule (`---`): chỉ dùng khi cần ngắt một chuyển cảnh lớn, không dùng thay khoảng trắng.

## Trước khi lưu

- Không có H1 trong body và không nhảy từ H2 xuống H4.
- Heading, paragraph và list không trùng ý nhau.
- Link, nguồn, code và số liệu đã được kiểm tra.
- Table không có quá nhiều cột hoặc nội dung quá dài; nếu có, cân nhắc đổi thành list.
- Preview bằng giao diện website thật và kiểm tra cả mobile.

Có thể copy raw Markdown sạch hoặc phần trả lời đã định dạng từ ChatGPT vào CMS. Không cần tự thêm class cho heading, table, blockquote, checklist, code, link hoặc ảnh; CMS chuyển Markdown thành block biên tập và Article Design System xử lý phần trình bày.
