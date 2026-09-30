# Cẩm nang sinh viên

Student Hub tĩnh dành cho sinh viên Việt Nam: bài hướng dẫn → checklist/công cụ → bước đọc tiếp theo.

## Phiên bản hiện tại

MVP gồm:

- 9 chủ đề dùng chung một nguồn taxonomy; chủ đề Kỹ năng gom các nhóm Kỹ năng máy tính và Kỹ năng mềm;
- hub chuyên sâu Sinh viên IT;
- bài viết Markdown/MDX và CMS local để biên tập, preview, xuất bản;
- 5 mini tool nội bộ cùng ứng dụng Typing Speed VN trên subdomain riêng;
- lọc/tìm bài phía client, sitemap, robots, canonical và structured data;
- cấu hình Cloudflare Workers Static Assets.

Không có database, login, analytics hoặc affiliate link ở V1. Backend production chỉ gồm endpoint Liên hệ nhỏ trong Cloudflare Worker.

## Chạy local

Yêu cầu Node.js 22.12 trở lên.

```bash
npm install
npm run dev
```

Mở địa chỉ do Astro in ra, mặc định `http://localhost:4321`.

## Validation

```bash
npm run validate
npm run deploy:dry
```

`validate` chạy Worker typecheck, Astro check, production build và kiểm tra title/H1/canonical/sitemap/link nội bộ. `deploy:dry` xác minh gói Static Assets mà không deploy.

## Thêm bài viết

1. Ưu tiên chạy `npm run cms` và mở `http://127.0.0.1:4310`.
2. Nếu tạo thủ công, đặt file `.md` hoặc `.mdx` trong `src/content/articles/<category>/`.
3. Dùng frontmatter theo `src/content.config.ts`.
4. Chọn một `category` từ `src/data/categories.ts`; `group` chỉ dùng khi category đó có cấu hình nhóm.
5. Đặt `draft: true` khi chưa muốn xuất bản.
6. Chạy `npm run validate` trước khi đưa lên repository.

Ví dụ tối thiểu:

```md
---
title: "Tiêu đề bài viết đủ rõ"
description: "Mô tả khoảng 40–180 ký tự, nói đúng vấn đề và kết quả người đọc nhận được."
category: hoc-tap-thi-cu
group: hoc-dung-cach
tags: [học tập]
publishedDate: 2026-09-14
author: Cẩm nang sinh viên
readingMinutes: 6
---
```

## Thiết lập URL production

Canonical, sitemap và `robots.txt` dùng domain `site` trong `astro.config.mjs`. Giá trị production hiện tại là `https://camnangsinhvien.site`:

```powershell
npm.cmd run validate
```

Xem đầy đủ tại `docs/DEPLOYMENT.md`.

## Tài liệu

- `docs/ARCHITECTURE.md`: kiến trúc và ranh giới hệ thống.
- `docs/DATA_MODEL.md`: schema content/tool và localStorage.
- `docs/ROADMAP.md`: phase, P0/P1/P2 và thứ tự nội dung.
- `docs/CONTENT_STRATEGY.md`: định vị, pillar, IT, SEO, tool và monetization.
- `docs/RESEARCH_SOURCES.md`: nguồn nghiên cứu ban đầu.
- `docs/TESTING.md`: phạm vi và kết quả kiểm thử MVP.
