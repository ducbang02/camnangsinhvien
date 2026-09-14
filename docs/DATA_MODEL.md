# Data model — Cẩm nang sinh viên

## 1. Nguyên tắc

V1 không có database. Nguồn dữ liệu chuẩn là file trong repository và được kiểm tra lúc build.

## 2. Article

Collection: `articles`, định dạng `.md` hoặc `.mdx`.

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
| --- | --- | --- | --- |
| `title` | string | Có | Tiêu đề hiển thị và SEO |
| `description` | string | Có | Mô tả ngắn, dùng trong card/meta |
| `category` | enum | Có | Một trong mười ID khai báo tại `src/data/categories.ts` |
| `topic` | string | Có | Nhóm nhỏ để gom cluster |
| `tags` | string[] | Có | Từ khóa điều hướng, không dùng để nhồi SEO |
| `publishedDate` | date | Có | Ngày xuất bản |
| `updatedDate` | date | Không | Ngày kiểm tra nội dung gần nhất |
| `author` | string | Có | Tác giả/chủ thể chịu trách nhiệm |
| `featured` | boolean | Không | Ưu tiên ở trang tổng hợp |
| `draft` | boolean | Không | Không build ra route công khai khi `true` |
| `readingMinutes` | number | Không | Thời gian đọc ước tính biên tập |
| `thumbnail` | string | Không | Đường dẫn public của ảnh đại diện bài viết |
| `thumbnailAlt` | string | Không | Mô tả thay thế cho thumbnail; CMS bắt buộc khi có thumbnail |
| `seoTitle` | string | Không | Tiêu đề SEO tùy chỉnh, tối đa 70 ký tự; fallback về `title` |
| `seoDescription` | string | Không | Meta description tùy chỉnh, tối đa 180 ký tự; fallback về `description` |
| `tool` | string | Không | Route mini tool liên quan |
| `video` | string URL | Không | Video bổ trợ đã được kiểm tra |
| `sources` | object[] | Không | Nhãn và URL nguồn tham khảo |

ID/slug được lấy từ đường dẫn file, ví dụ `hoc-tap-thi-cu/cach-tinh-gpa.md` thành `hoc-tap-thi-cu/cach-tinh-gpa` ở collection; route công khai sử dụng phần tên file để giữ URL ngắn.

CMS dùng slug làm tên file và kiểm tra slug duy nhất trên toàn collection vì route công khai không chứa category. Trạng thái form `Draft`/`Published` được lưu thành `draft: true`/`draft: false`. Các field cũ không xuất hiện trên form như `author`, `featured`, `tool`, `video` và `sources` được giữ nguyên khi sửa bài.

## 3. Category / trụ cột

Trụ cột là dữ liệu TypeScript tĩnh trong `src/data/categories.ts`. Đây là nguồn chuẩn duy nhất cho toàn website:

```ts
type Category = {
  id: CategoryId;
  name: string;
  shortName: string;
  description: string;
  menuDescription: string;
  promise: string;
  accent: 'mint' | 'blue' | 'yellow' | 'coral';
  seoTitle: string;
  metaDescription: string;
  steps: { label: string; text: string }[];
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
  category: CategoryId;
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
