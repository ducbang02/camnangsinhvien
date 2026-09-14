# CMS local — Cẩm nang sinh viên

## Phạm vi hiện tại

CMS Phase 1 là công cụ biên tập chạy trên máy người vận hành. Công cụ chỉ tạo và sửa bài trong `src/content/articles/`; không có database, tài khoản, API production hay dịch vụ CMS bên ngoài. Thư mục `cms/` không được Astro import nên không xuất hiện trong `dist/`.

Phase 1 hỗ trợ:

- danh sách, tìm kiếm và lọc bài theo 10 trụ cột;
- tạo hoặc mở bài Markdown/MDX hiện có;
- editor Tiptap Vanilla với H2/H3, bold, italic, link, bullet list, numbered list, checklist, blockquote, code block, horizontal rule và table;
- form metadata dùng trực tiếp schema Content Collection;
- làm sạch style/font thừa khi dán từ Word hoặc Google Docs;
- lưu local với kiểm tra dữ liệu, chống path traversal, chống trùng slug và cảnh báo file bị thay đổi bên ngoài;
- preview bài draft bằng chính route và layout Astro thật.

Chưa có trong Phase 1: upload/chèn ảnh, caption ảnh, YouTube block và quy trình Git commit/push. Nút `Xuất bản · Phase 2` được khóa có chủ đích.

## Cách chạy

Yêu cầu Node.js từ `22.12.0` trở lên và đã chạy `npm install`.

```bash
npm run cms
```

Sau đó mở:

- CMS: `http://127.0.0.1:4310/`
- website/preview thật: `http://127.0.0.1:4321/`

Lệnh CMS tự dùng Astro server đang chạy ở cổng `4321`; nếu chưa có, CMS sẽ khởi động Astro. Nhấn `Ctrl+C` tại terminal CMS để dừng tiến trình do CMS khởi động.

## Quy tắc lưu file

- File nằm tại `src/content/articles/<category>/<slug>.md` hoặc giữ đuôi `.mdx` nếu bài cũ là MDX.
- Category đọc trực tiếp từ `src/data/categories.ts`, không có danh sách hard-code thứ hai.
- `Lưu nháp` luôn đặt `draft: true`; `Lưu thay đổi` giữ trạng thái đang chọn.
- Preview luôn lưu local trước, sau đó mở `/cam-nang/<slug>/` trên Astro dev server.
- Astro dev hiển thị draft để preview; production build vẫn loại `draft: true`.
- CMS không chạy Git trong Phase 1.

## Metadata CMS

Các trường `title`, `description`, `category`, `topic`, `tags`, `publishedDate` và `draft` ánh xạ trực tiếp vào schema cũ. Các trường tùy chọn mới có backward compatibility:

- `thumbnail` và `thumbnailAlt`;
- `seoTitle` và `seoDescription`.

Nếu SEO title/description trống, trang bài viết tiếp tục dùng title/description chính. Upload media sẽ được bổ sung ở CMS Phase 2; Phase 1 chỉ nhận đường dẫn file đã có trong `public/`.

## Kiểm tra tự động

```bash
npm run test:cms
npm run validate
```

`test:cms` chỉ tạo dữ liệu trong thư mục tạm của hệ điều hành, không sửa bài thật. Test bao phủ tạo/đọc/cập nhật Markdown, table/checklist và khóa ghi khi file bị thay đổi ngoài CMS.

## Checklist thủ công Phase 1

- Mở danh sách và xác nhận đủ bài, đúng category/status.
- Search theo một phần tiêu đề; lọc lần lượt một category.
- Mở bài cũ và kiểm tra metadata/nội dung được nạp đúng.
- Tạo bài mới, kiểm tra slug tự sinh và có thể sửa tay.
- Thử đủ nút toolbar, đặc biệt checklist và table.
- Dán một đoạn từ Word/Google Docs có heading, bold, list, table và link.
- Bỏ trống từng trường bắt buộc để xem thông báo validation.
- Lưu nháp, kiểm tra file có `draft: true` và không có Git commit mới.
- Sửa file cùng lúc ngoài CMS rồi lưu để xác nhận cảnh báo version conflict.
- Bấm Preview và xác nhận bài draft dùng đúng header, breadcrumb, article layout, related articles và footer của website.
- Chạy production build và xác nhận route draft không có trong `dist/cam-nang/`.
