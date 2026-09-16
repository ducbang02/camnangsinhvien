# Deploy lên Cloudflare Workers Static Assets

Ngày rà soát tài liệu: 14/09/2026.

Cloudflare khuyến nghị Workers Static Assets cho dự án tĩnh mới. Dự án này không có Worker script, binding, database hoặc secret runtime.

Các URL chủ đề cũ được chuyển hướng `301` bằng `public/_redirects`; file này được Astro chép vào `dist/` và Cloudflare Workers Static Assets xử lý khi deploy.

## Production hiện tại

- Worker: `cam-nang-sinh-vien`
- URL: `https://cam-nang-sinh-vien.nguyenducbang-uit.workers.dev/`
- Repository: `ducbang02/camnangsinhvien`
- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build variable: `SITE_URL=https://cam-nang-sinh-vien.nguyenducbang-uit.workers.dev`
- Cloudflare Access: tắt; website công khai.
- Non-production branch builds: bật.

Deployment đầu tiên ngày 14/09/2026 đã build và deploy thành công. Mỗi push mới lên `main` sẽ kích hoạt Workers Builds.

Sau khi repository được transfer, cập nhật remote của clone local trước lần push tiếp theo:

```powershell
git remote set-url origin https://github.com/ducbang02/camnangsinhvien.git
```

## Phương án đề xuất: Workers Builds + GitHub

Ưu điểm: mỗi push vào `main` được build/deploy nhất quán; branch khác có thể tạo preview version; không cần lưu API token trong repository.

### Chuẩn bị repository

1. Khởi tạo Git và đưa source lên một GitHub repository riêng.
2. Không commit `node_modules`, `dist`, `.wrangler` hoặc `.env`.
3. Chạy `npm run validate` trước khi push.

### Kết nối trên Cloudflare

1. Vào **Workers & Pages → Create application → Import a repository**.
2. Kết nối GitHub và chỉ cấp quyền repository cần deploy nếu có thể.
3. Chọn repository, branch production `main`.
4. Worker name phải khớp `name` trong `wrangler.jsonc`: `cam-nang-sinh-vien`.
5. Build command: `npm run build`.
6. Deploy command: `npx wrangler deploy`.
7. Thêm build variable `SITE_URL` bằng URL production đầy đủ, ví dụ `https://camnangsinhvien.vn`.
8. Save and Deploy, chờ trạng thái thành công.

Workers Builds dùng phiên bản Wrangler đã khóa trong `package.json`.

## Phương án thủ công bằng Wrangler

Chỉ dùng khi muốn deploy từ máy local:

```powershell
npx.cmd wrangler login
$env:SITE_URL='https://ten-mien-cua-ban.vn'
npm.cmd run deploy
```

Lệnh sẽ build rồi upload thư mục `dist` theo `wrangler.jsonc`. Trước lần deploy đầu, kiểm tra tên Worker để không ghi đè project khác.

## Custom domain

Sau khi Worker chạy ổn ở `workers.dev`:

1. Mở Worker → **Settings → Domains & Routes**.
2. Thêm custom domain đang quản lý trong Cloudflare.
3. Đặt `SITE_URL` thành custom domain và deploy lại để canonical/sitemap/robots đúng.

Không đưa domain `camnangsinhvien.example` lên production; đây chỉ là placeholder để local build có canonical hợp lệ.

## Smoke test production

- Mở `/`, `/cam-nang/`, một trang chủ đề và một bài.
- Dùng GPA Calculator với: 3 tín chỉ × 3.0, 3 tín chỉ × 4.0, 2 tín chỉ × 2.5; kết quả phải là 3.25.
- Dùng Final Grade: quá trình 7.5, cuối kỳ 60%, mục tiêu 8.0; kết quả 8.33.
- Kiểm tra `/robots.txt` và `/sitemap-index.xml` dùng đúng domain.
- Mở một URL không tồn tại và xác nhận trang 404.
- Kiểm tra header bảo mật và cache cho `/_astro/*`.
- Kiểm tra mobile 390px không tràn ngang.

## Plugin Cloudflare

Plugin `cloudflare@openai-curated-remote` có trong catalog nhưng chưa được cài/kết nối. MVP không phụ thuộc plugin. Nếu muốn Codex thao tác trực tiếp tài khoản Cloudflare ở lượt sau, hãy cài plugin, xem kỹ quyền được yêu cầu và chỉ cấp phạm vi tài khoản/repository cần thiết. Rủi ro chính là quyền tạo/sửa deployment và tài nguyên Cloudflare; không nên cấp quyền rộng chỉ để build local.

Nguồn:

- https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/static-assets/headers/
