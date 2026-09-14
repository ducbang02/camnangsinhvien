# Cẩm nang sinh viên

Student Hub tĩnh dành cho sinh viên Việt Nam: bài hướng dẫn → checklist/công cụ → bước đọc tiếp theo.

## Phiên bản hiện tại

MVP gồm:

- ba trụ cột: Học tập & phát triển bản thân, Kỹ năng số & công cụ, Cuộc sống sinh viên;
- hub chuyên sâu Sinh viên IT;
- 20 bài mở đầu bằng Markdown;
- 5 mini tool client-side: GPA, điểm cuối kỳ, Pomodoro, chia nhóm và ngân sách;
- lọc/tìm bài phía client, sitemap, robots, canonical, Article/Breadcrumb structured data;
- cấu hình Cloudflare Workers Static Assets.

Không có backend, database, login, analytics hoặc affiliate link ở V1.

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

`validate` chạy type/content check và production build. `deploy:dry` xác minh gói Static Assets mà không deploy.

## Thêm bài viết

1. Tạo file `.md` hoặc `.mdx` trong `src/content/articles/<nhom>/`.
2. Dùng frontmatter theo `src/content.config.ts`.
3. Chỉ dùng một trong ba `pillar`: `hoc-tap`, `ky-nang-so`, `cuoc-song`.
4. Đặt `draft: true` khi chưa muốn xuất bản.
5. Chạy `npm run validate` trước khi đưa lên repository.

Ví dụ tối thiểu:

```md
---
title: "Tiêu đề bài viết đủ rõ"
description: "Mô tả khoảng 40–180 ký tự, nói đúng vấn đề và kết quả người đọc nhận được."
pillar: hoc-tap
topic: Phương pháp học
tags: [học tập]
publishedDate: 2026-09-14
author: Cẩm nang sinh viên
readingMinutes: 6
---
```

## Thiết lập URL production

Canonical, sitemap và `robots.txt` dùng biến `SITE_URL`. Trước build production, đặt URL thật, không giữ domain `.example`:

```powershell
$env:SITE_URL='https://ten-mien-cua-ban.vn'
npm.cmd run build
```

Xem đầy đủ tại `docs/DEPLOYMENT.md`.

## Tài liệu

- `docs/ARCHITECTURE.md`: kiến trúc và ranh giới hệ thống.
- `docs/DATA_MODEL.md`: schema content/tool và localStorage.
- `docs/ROADMAP.md`: phase, P0/P1/P2 và thứ tự nội dung.
- `docs/CONTENT_STRATEGY.md`: định vị, pillar, IT, SEO, tool và monetization.
- `docs/RESEARCH_SOURCES.md`: nguồn nghiên cứu ban đầu.
- `docs/TESTING.md`: phạm vi và kết quả kiểm thử MVP.
