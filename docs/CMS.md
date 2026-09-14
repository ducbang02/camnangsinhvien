# CMS local — Cẩm nang sinh viên

## Phạm vi hiện tại

CMS Phase 2 là công cụ biên tập và xuất bản chạy trên máy người vận hành. Công cụ tạo/sửa bài trong `src/content/articles/`, lưu media trong `public/media/articles/` và chỉ gọi Git sau bước xác nhận; không có database, tài khoản, API production hay dịch vụ CMS bên ngoài. Thư mục `cms/` không được Astro import nên không xuất hiện trong `dist/`.

CMS hỗ trợ:

- danh sách, tìm kiếm và lọc bài theo 10 trụ cột;
- tạo hoặc mở bài Markdown/MDX hiện có;
- editor Tiptap Vanilla với H2/H3, bold, italic, link, bullet list, numbered list, checklist, blockquote, code block, horizontal rule và table;
- form metadata dùng trực tiếp schema Content Collection;
- làm sạch style/font thừa khi dán từ Word hoặc Google Docs;
- lưu local với kiểm tra dữ liệu, chống path traversal, chống trùng slug và cảnh báo file bị thay đổi bên ngoài;
- preview bài draft bằng chính route và layout Astro thật.
- upload thumbnail hoặc ảnh nội dung định dạng JPEG, PNG, GIF, WebP, AVIF, tối đa 10 MB;
- alt text bắt buộc, caption tùy chọn và block YouTube từ URL;
- xuất bản hai bước với validation, kiểm tra Git, danh sách file, commit và push branch hiện tại.

CMS không tối ưu/chuyển đổi ảnh tự động; người vận hành nên ưu tiên WebP/AVIF đã nén trước khi upload.

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
- Ảnh nằm tại `public/media/articles/<slug>/`, không dùng base64 trong Markdown.
- `Lưu nháp`, `Lưu thay đổi` và `Preview` không commit hoặc push.

## Quy trình Xuất bản

1. Nhấn `Xuất bản`; CMS ép trạng thái bài hiện tại thành Published và validate dữ liệu.
2. CMS dừng nếu Git có staged file, detached HEAD, merge/rebase dở dang hoặc thay đổi không thuộc bài hiện tại.
3. CMS chạy `npm run validate` và hiển thị branch, remote cùng đúng danh sách file sắp commit.
4. Kiểm tra/sửa commit message rồi nhấn `Commit và push`.
5. CMS stage đúng danh sách đã hiển thị, kiểm tra lại snapshot, commit và chạy `git push origin <branch>`; không force push.
6. Cloudflare chỉ auto deploy production khi branch được push là branch đang được Cloudflare theo dõi (`main` ở cấu hình hiện tại).

Nếu push thất bại sau khi commit, commit vẫn nằm an toàn trên máy. Kiểm tra kết nối/remote rồi chạy `git push origin <branch>` thủ công; CMS không tự hoàn tác commit và không force push.

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

## Checklist thủ công

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
- Upload thumbnail, nhập alt rồi preview.
- Chèn ảnh nội dung có alt/caption và xác nhận file nằm đúng thư mục theo slug.
- Chèn YouTube bằng URL `watch`, `youtu.be` hoặc `shorts` và kiểm tra tỷ lệ 16:9.
- Khi repository có file khác đang sửa, nhấn Xuất bản và xác nhận CMS dừng trước khi stage.
- Trên repository sạch, kiểm tra danh sách file trong hộp xác nhận trước khi commit/push.
