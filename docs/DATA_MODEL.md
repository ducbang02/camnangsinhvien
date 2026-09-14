# Data model — Cẩm nang sinh viên

## 1. Nguyên tắc

V1 không có database. Nguồn dữ liệu chuẩn là file trong repository và được kiểm tra lúc build.

## 2. Article

Collection: `articles`, định dạng `.md` hoặc `.mdx`.

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
| --- | --- | --- | --- |
| `title` | string | Có | Tiêu đề hiển thị và SEO |
| `description` | string | Có | Mô tả ngắn, dùng trong card/meta |
| `pillar` | enum | Có | Một trong ba trụ cột |
| `topic` | string | Có | Nhóm nhỏ để gom cluster |
| `tags` | string[] | Có | Từ khóa điều hướng, không dùng để nhồi SEO |
| `publishedDate` | date | Có | Ngày xuất bản |
| `updatedDate` | date | Không | Ngày kiểm tra nội dung gần nhất |
| `author` | string | Có | Tác giả/chủ thể chịu trách nhiệm |
| `featured` | boolean | Không | Ưu tiên ở trang tổng hợp |
| `draft` | boolean | Không | Không build ra route công khai khi `true` |
| `readingMinutes` | number | Không | Thời gian đọc ước tính biên tập |
| `tool` | string | Không | Route mini tool liên quan |
| `video` | string URL | Không | Video bổ trợ đã được kiểm tra |
| `sources` | object[] | Không | Nhãn và URL nguồn tham khảo |

ID/slug được lấy từ đường dẫn file, ví dụ `hoc-tap/cach-tinh-gpa.md` thành `hoc-tap/cach-tinh-gpa` ở collection; route công khai sử dụng phần tên file để giữ URL ngắn.

## 3. Pillar

Pillar là dữ liệu TypeScript tĩnh:

```ts
type Pillar = {
  id: 'hoc-tap' | 'ky-nang-so' | 'cuoc-song';
  name: string;
  shortName: string;
  description: string;
  promise: string;
  color: string;
};
```

## 4. Tool

Tool metadata là dữ liệu tĩnh; trạng thái thao tác chỉ tồn tại trong DOM hoặc `localStorage`.

```ts
type Tool = {
  slug: string;
  name: string;
  description: string;
  status: 'ready' | 'planned';
  pillar: Pillar['id'];
  icon: string;
};
```

Khóa localStorage có namespace `cnsv:v1:*` để tránh xung đột và cho phép migration sau này:

- `cnsv:v1:gpa-history`
- `cnsv:v1:pomodoro-settings`
- `cnsv:v1:budget`

Không lưu tên thật, email, trường, mã sinh viên hoặc dữ liệu nhạy cảm.

## 5. Affiliate card (P1)

Chưa kích hoạt ở V1. Khi dùng, dữ liệu phải tách khỏi nội dung để dễ kiểm kê:

```ts
type AffiliateCard = {
  productName: string;
  reason: string;
  priceNote?: string;
  url: string;
  merchant: 'shopee';
  reviewedAt: string;
  disclosure: string;
};
```

Không lưu giá cứng nếu không có quy trình cập nhật. Link phải có disclosure và `rel="sponsored nofollow"`.

## 6. Khả năng chuyển sang database

Nếu V3 chứng minh cần dữ liệu đồng bộ, giữ schema nội dung hiện tại và chỉ đưa phần user-generated state sang D1/KV. Không chuyển article vào database chỉ để có “admin”; Markdown/MDX vẫn là nguồn chuẩn cho đến khi số lượng và quy trình biên tập chứng minh CMS là cần thiết.
