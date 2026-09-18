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
| `group` | string | Tùy category | ID group khai báo trong chính category; bắt buộc khi category có `groups`, không dùng khi category không chia group |
| `articleOrder` | integer dương | Không | Thứ tự bài trong group hoặc trong danh sách phẳng; bài không khai báo được xếp sau các bài có thứ tự |
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

CMS dùng slug làm tên file và kiểm tra slug duy nhất trên toàn collection vì route công khai không chứa category. Trạng thái form `Draft`/`Published` được lưu thành `draft: true`/`draft: false`. CMS cho phép chỉnh `tool` bằng danh sách công cụ chung và chỉnh `sources` bằng các cặp tên nguồn/URL. Các field chưa xuất hiện trên form như `author`, `featured` và `video` vẫn được giữ nguyên khi sửa bài.

Vòng đời bài viết không cần database: gỡ khỏi website chỉ đổi `draft: true`; xóa sẽ di chuyển file nguồn vào `.cms-trash/<timestamp>/src/content/articles/...` trên máy local. Nếu chọn xóa media, thư mục `public/media/articles/<slug>/` cũng được chuyển vào cùng bản thùng rác. Thùng rác không thuộc Git và có thể phục hồi thủ công bằng cách chép file về đường dẫn cũ.

Media do CMS tải lên nằm tại `public/media/articles/<slug>/`. Markdown không chứa base64. Ảnh trong nội dung được lưu bằng block `<figure class="article-figure" data-cms-image>` gồm `img` có alt bắt buộc và `figcaption` tùy chọn. YouTube được lưu bằng block `.video-embed` chỉ chứa video ID hợp lệ và iframe `youtube-nocookie.com`; cả hai block đều được Astro render trực tiếp trong article layout.

## 3. Category / chủ đề

Chủ đề là dữ liệu TypeScript tĩnh trong `src/data/categories.ts`. Đây là nguồn chuẩn duy nhất cho toàn website:

```ts
type Category = {
  id: CategoryId;
  name: string;
  shortName: string;
  number: string;
  heroImage: string;
  description: string;
  menuDescription: string;
  promise: string;
  accent: 'mint' | 'blue' | 'yellow' | 'coral';
  seoTitle: string;
  metaDescription: string;
  steps?: { label: string; text: string }[];
  groups?: CategoryGroup[];
};

type CategoryGroup = {
  id: string;
  title: string;
  shortTitle?: string;
  description: string;
  navigationDescription?: string;
  order: number;
};
```

`heroImage` là ảnh hero mặc định của chủ đề trong `public/media/category-heroes/`. Article ưu tiên `thumbnail` riêng; khi field này trống, article tự dùng `heroImage` của category để không bắt buộc tạo ảnh mới cho mọi bài.

`groups` là tùy chọn và có số lượng bất kỳ. Trang chủ đề có `groups` sẽ tạo navigation anchor và chia bài theo `group`; trang không khai báo hoặc dùng `groups: []` tiếp tục render danh sách phẳng. Schema kiểm tra chéo để `group` của article phải thuộc đúng category. `group.order` điều khiển thứ tự group, còn `articleOrder` điều khiển thứ tự bài nên hai khái niệm không bị nhập nhằng.

CMS local quản lý trực tiếp category/group trong vùng `CMS_CATEGORIES_START` đến `CMS_CATEGORIES_END`. Mỗi lần lưu dùng version của file để phát hiện ghi đè đồng thời và thay file tạm theo kiểu atomic. `Category.id` và `CategoryGroup.id` không được đổi sau khi tạo; muốn xóa phải chuyển hoặc xóa hết bài đang tham chiếu trước. `Category.number` là hai chữ số duy nhất dùng để sắp thứ tự chủ đề, còn `CategoryGroup.order` là số nguyên dương duy nhất trong từng category.

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

## 7. Dữ liệu form Liên hệ

Form gửi payload tạm thời tới `/api/contact`; payload không được ghi vào repository, KV, D1 hoặc database khác.

```ts
type ContactPayload = {
  name: string;             // 2–80 ký tự
  email: string;            // tối đa 254 ký tự
  type: 'gop-y-noi-dung' | 'bao-loi-cap-nhat' | 'hop-tac' | 'khac';
  message: string;          // 20–5.000 ký tự
  website: string;          // honeypot, phải rỗng
  turnstileToken: string;   // tối đa 2.048 ký tự, dùng một lần
};
```

Sau khi validate và xác minh Turnstile, Worker dựng email dạng text/HTML đã escape rồi gửi tới địa chỉ quản trị cố định. `Reply-To` lấy từ `email`; nội dung form chỉ còn tồn tại trong hệ thống email của người nhận theo chính sách của nhà cung cấp email.
