# AGENTS.md

Tài liệu này quy định cách Codex phân tích yêu cầu, đưa ra quyết định, sửa code, kiểm thử, cập nhật tài liệu và báo cáo kết quả trong project.

Mục tiêu chung:

* Ưu tiên giải pháp **đơn giản, đúng, dễ bảo trì và ít rủi ro**.
* Không viết thêm code nếu platform, project hoặc dependency hiện tại đã giải quyết được.
* Không over-engineering.
* Không tự ý mở rộng scope ngoài yêu cầu.
* Luôn hiểu kiến trúc hiện tại trước khi sửa.
* Ưu tiên sửa **root cause** thay vì vá symptom.
* Không đánh đổi security, validation, accessibility, data integrity hoặc error handling chỉ để giảm code.
* Sau khi hoàn thành phải kiểm thử như một người dùng thật.

---

# 1. Trước khi code

## 1.1. Đọc và hiểu yêu cầu

Đọc toàn bộ prompt của người dùng trước khi thay đổi bất kỳ file nào.

Trước tiên phải xác định:

* Người dùng thực sự muốn đạt kết quả gì?
* Đây là bug fix, feature mới, refactor, cấu hình, deploy hay thay đổi dữ liệu?
* Phạm vi thay đổi nằm ở đâu?
* Có ảnh hưởng đến database, production, deploy, authentication, security hoặc third-party service hay không?
* Project hiện tại đã có chức năng tương tự chưa?

Không chỉ làm theo từng câu chữ một cách máy móc.

Các nội dung người dùng đưa ra có thể là **đề xuất**, không nhất thiết là giải pháp kỹ thuật tối ưu.

Nếu tìm thấy cách đơn giản hơn, an toàn hơn hoặc phù hợp kiến trúc hiện tại hơn thì phải nêu ra.

---

## 1.2. Khi nào cần hỏi người dùng

Không hỏi chỉ vì có nhiều cách viết code khác nhau.

Có thể tự quyết và thực hiện luôn nếu:

* yêu cầu rõ ràng;
* chỉ có một hướng triển khai hợp lý;
* thay đổi nhỏ và dễ hoàn tác;
* không ảnh hưởng đáng kể đến production, database, security hoặc dịch vụ bên thứ ba;
* lựa chọn kỹ thuật không làm thay đổi hành vi mà người dùng mong muốn.

Phải hỏi xác nhận trước khi code nếu:

* prompt còn mơ hồ và có thể hiểu theo nhiều nghĩa khác nhau;
* có từ hai hướng triển khai hợp lý nhưng khác nhau đáng kể về kiến trúc;
* phải thêm hoặc thay dependency quan trọng;
* liên quan database schema hoặc dữ liệu production;
* liên quan authentication, authorization hoặc security;
* liên quan third-party service/API;
* có thể gây breaking change;
* có nguy cơ mất dữ liệu;
* có thay đổi đáng kể về cách deploy hoặc vận hành;
* giải pháp đề xuất của người dùng có rủi ro đáng kể và có phương án tốt hơn.

Trước khi hỏi, trình bày ngắn gọn:

1. Các phương án khả thi.
2. Ưu điểm và nhược điểm.
3. Ảnh hưởng đến code, database và deploy.
4. Phương án được đề xuất.
5. Nội dung cụ thể cần người dùng xác nhận.

Nếu người dùng đã chỉ rõ một phương án và phương án đó không có rủi ro đáng kể thì thực hiện luôn.

---

# 2. Đọc tài liệu project

Trước khi code phải kiểm tra và đọc:

1. `docs/ARCHITECTURE.md`
2. `docs/DATA_MODEL.md`
3. phase hiện tại trong `docs/ROADMAP.md`

Ngoài ra đọc các tài liệu liên quan trực tiếp đến khu vực đang sửa nếu có.

Nếu một trong các file trên chưa tồn tại:

* tạo file tương ứng dựa trên project hiện tại và các yêu cầu người dùng đã cung cấp;
* không bịa kiến trúc hoặc requirement chưa có căn cứ;
* ghi rõ những assumption nếu bắt buộc phải suy luận.

Mỗi lần thay đổi kiến trúc, data model, route, workflow hoặc roadmap phải cập nhật lại tài liệu tương ứng.

Documentation phải phản ánh **trạng thái thực tế của code**, không phải trạng thái dự kiến.

---

# 3. Kiểm tra repository trước khi sửa

Trước khi thay đổi code:

* kiểm tra `git status`;
* xác định các thay đổi chưa commit đang có;
* phân biệt thay đổi của người dùng với thay đổi do Codex tạo;
* không ghi đè hoặc hoàn tác thay đổi của người dùng nếu không được yêu cầu.

Đọc code liên quan trước khi tạo file hoặc abstraction mới.

Tìm kiếm xem project đã có:

* component tương tự;
* helper tương tự;
* utility tương tự;
* API/function tương tự;
* style tương tự;
* plugin/dependency có khả năng giải quyết yêu cầu;
* convention hoặc pattern đang được sử dụng.

Ưu tiên mở rộng những gì đã tồn tại thay vì tạo một hệ thống song song.

---

# 4. Nguyên tắc Ponytail — ưu tiên giải pháp tối giản

Trước khi viết code mới, lần lượt kiểm tra:

## Bước 1 — Có thực sự cần feature/code này không?

Không triển khai functionality không cần thiết cho yêu cầu hiện tại.

Không tự thêm:

* hệ thống cấu hình mới;
* abstraction mới;
* compatibility layer;
* caching;
* state management;
* API;
* database;
* dependency;
* automation;

nếu yêu cầu hiện tại chưa cần.

Áp dụng nguyên tắc **YAGNI — You Aren't Gonna Need It**.

---

## Bước 2 — Project đã có thứ giải quyết vấn đề chưa?

Ưu tiên:

1. code hiện có;
2. component hiện có;
3. helper hiện có;
4. convention hiện có;
5. infrastructure hiện có.

Không tạo duplicate implementation chỉ vì viết mới dễ hơn đọc code cũ.

---

## Bước 3 — Platform hoặc standard library có giải quyết được không?

Trước khi thêm code hoặc dependency, kiểm tra khả năng dùng:

* HTML native;
* CSS native;
* browser API;
* WordPress core;
* PHP standard library;
* JavaScript/TypeScript standard API;
* framework API;
* database capability;
* hosting/platform capability.

Ví dụ:

Nếu HTML native giải quyết được thì không thêm JavaScript library chỉ để thay thế functionality tương tự.

---

## Bước 4 — Dependency hiện có có giải quyết được không?

Nếu project đã có dependency phù hợp thì ưu tiên sử dụng dependency đó.

Không thêm package mới chỉ vì package khác có API thuận tiện hơn một chút.

Mỗi dependency mới đều làm tăng:

* maintenance cost;
* security surface;
* bundle size;
* khả năng conflict;
* update burden;
* complexity.

---

## Bước 5 — Giải pháp nhỏ nhất đúng là gì?

Ưu tiên:

> smallest correct change

Không tối ưu cho số dòng code ít nhất bằng mọi giá.

Tối ưu cho:

* ít complexity;
* ít file;
* ít dependency;
* ít state;
* ít abstraction;
* ít moving parts;
* dễ hiểu;
* dễ test;
* dễ rollback.

Một thay đổi nhỏ nhưng rõ ràng thường tốt hơn một architecture mới hoàn chỉnh.

---

# 5. Không over-engineering

Không tạo abstraction chỉ để dự đoán nhu cầu tương lai.

Không tạo:

* interface chỉ có một implementation nếu chưa có lý do rõ ràng;
* factory chỉ để khởi tạo một object đơn giản;
* service layer cho logic rất nhỏ;
* wrapper quanh API đã đủ rõ;
* helper chỉ được gọi một lần nếu inline dễ hiểu hơn;
* config system cho một giá trị cố định;
* generic system khi requirement hiện tại chỉ có một trường hợp;
* state management library khi local state/native mechanism đã đủ.

Rule:

> Duplication nhỏ đôi khi tốt hơn abstraction sai.

Chỉ abstraction khi có pattern lặp lại thực sự hoặc kiến trúc project yêu cầu.

---

# 6. Fix root cause, không vá symptom

Khi gặp bug:

1. Reproduce bug.
2. Xác định nguyên nhân gốc.
3. Kiểm tra data flow liên quan.
4. Sửa tại nơi nguyên nhân phát sinh.
5. Kiểm tra regression.

Không thêm workaround ở UI nếu lỗi nằm ở backend.

Không thêm conditional đặc biệt nếu nguyên nhân là data model sai.

Không thêm retry vô hạn nếu nguyên nhân là request sai.

Không suppress error chỉ để test pass.

Nếu root cause nằm ngoài phạm vi có thể sửa, phải nói rõ.

---

# 7. Plugin và dependency

Nếu yêu cầu có khả năng giải quyết bằng plugin có sẵn, đặc biệt với WordPress:

Trước tiên kiểm tra:

* plugin nào phù hợp;
* nhà phát triển/nguồn plugin;
* mức độ phổ biến hoặc độ tin cậy;
* plugin còn được maintain hay không;
* chức năng nào có trong bản miễn phí;
* chức năng nào yêu cầu Pro;
* dependency;
* compatibility;
* security risk;
* performance impact;
* lock-in risk;
* khả năng thay thế bằng WordPress core hoặc code nhỏ hơn.

Không tự cài hoặc activate plugin nếu người dùng chưa chọn plugin đó, trừ khi người dùng đã yêu cầu rõ ràng từ trước.

Không dùng plugin chỉ để giải quyết một functionality rất nhỏ nếu WordPress core hoặc một đoạn code đơn giản, an toàn đã đủ.

Không tự viết lại một functionality phức tạp mà plugin uy tín đã giải quyết tốt nếu điều đó làm tăng đáng kể maintenance hoặc security risk.

---

# 8. Security và dữ liệu

Nguyên tắc tối giản không được dùng để loại bỏ các biện pháp cần thiết về:

* authentication;
* authorization;
* CSRF protection;
* nonce;
* validation;
* sanitization;
* escaping;
* rate limiting khi cần;
* permission checks;
* error handling;
* backup;
* transaction/data integrity;
* secret management.

Đối với WordPress:

* kiểm tra capability;
* sử dụng nonce khi phù hợp;
* sanitize input;
* escape output;
* không hard-code credential;
* không lưu secret vào repository.

Đối với production data:

* không tự xóa;
* không tự migrate destructive;
* không reset;
* không seed đè;
* không thay đổi schema nguy hiểm;

nếu chưa được người dùng xác nhận.

---

# 9. Khi code

Trong quá trình triển khai:

* Giữ scope đúng với yêu cầu.
* Không refactor các khu vực không liên quan chỉ vì nhìn thấy code chưa đẹp.
* Không đổi style toàn project nếu task không yêu cầu.
* Không đổi framework/dependency nếu không cần thiết.
* Không tạo file mới nếu sửa file hiện tại hợp lý hơn.
* Không copy/paste logic lớn nếu có function hiện tại có thể tái sử dụng.

Code phải:

* rõ ràng;
* dễ đọc;
* phù hợp convention hiện tại;
* không có dead code;
* không có debug code không cần thiết;
* không chứa secret;
* có error handling phù hợp.

Comment trong code dùng tiếng Anh khi cần.

Không comment những điều code đã thể hiện rõ.

Comment nên giải thích **why**, không chỉ mô tả **what**.

---

# 10. Giải thích quyết định kỹ thuật

Khi có quyết định kỹ thuật đáng chú ý, phải giải thích ngắn gọn:

* vấn đề là gì;
* root cause hoặc constraint là gì;
* tại sao chọn cách hiện tại;
* vì sao không chọn cách phức tạp hơn;
* trade-off nếu có.

Không cần giải thích từng dòng code.

---

# 11. Test trong quá trình code

Không chờ đến cuối mới test.

Sau mỗi phần thay đổi quan trọng, chạy check phù hợp.

Tùy project có thể gồm:

* unit test;
* integration test;
* lint;
* typecheck;
* build;
* validation;
* smoke test;
* browser test;
* WordPress test;
* manual test.

Ưu tiên test trực tiếp behavior vừa thay đổi.

Không chạy một bộ test cực lớn nếu một check nhỏ đã đủ để phát hiện lỗi trong bước hiện tại, nhưng trước khi kết thúc phải chạy validation cần thiết của project.

---

# 12. Tạo dữ liệu test

Nếu cần dữ liệu để kiểm thử:

* tự tạo dữ liệu test hợp lý;
* không dùng dữ liệu production nếu không cần;
* không để test data rác trong production;
* cleanup test data nếu appropriate.

Test các trường hợp:

* normal case;
* empty state;
* invalid input;
* edge case quan trọng;
* error state nếu relevant.

---

# 13. Test như người dùng thật

Sau khi code xong phải đóng vai người dùng thật.

Không chỉ kiểm tra code compile.

Nếu có thể, truy cập application và thực hiện workflow thực tế.

Ví dụ WordPress:

1. vào `wp-admin`;
2. thao tác đúng flow của admin;
3. tạo/sửa nội dung;
4. kiểm tra frontend;
5. kiểm tra responsive nếu liên quan;
6. kiểm tra logout/login nếu liên quan;
7. kiểm tra role/permission nếu liên quan.

Ví dụ website:

1. mở trang;
2. click navigation;
3. nhập dữ liệu;
4. submit;
5. reload;
6. kiểm tra URL;
7. kiểm tra mobile viewport nếu relevant;
8. kiểm tra console error;
9. kiểm tra broken links/assets nếu relevant.

Mục tiêu:

> Không chỉ chứng minh code chạy, mà chứng minh workflow người dùng hoạt động.

---

# 14. Khi người dùng đổi hướng giữa chừng

Nếu người dùng thay đổi requirement:

1. Dừng hướng triển khai hiện tại.
2. Kiểm tra `git status`.
3. Xác định phần thay đổi do Codex vừa tạo.
4. Xác định phần thay đổi đã tồn tại trước đó.
5. Chỉ hoàn tác phần do Codex tạo nếu phần đó không còn phù hợp.
6. Không đụng vào thay đổi của người dùng.
7. Đọc lại requirement mới.
8. Đánh giá lại kiến trúc trước khi tiếp tục.

Không cố giữ lại code cũ chỉ vì đã mất công viết.

---

# 15. Documentation

Sau khi có thay đổi liên quan, tự động cập nhật các file trong `docs/`.

Tùy nội dung thay đổi:

### `docs/ARCHITECTURE.md`

Cập nhật khi thay đổi:

* architecture;
* component;
* service;
* integration;
* authentication;
* external system;
* deploy architecture.

### `docs/DATA_MODEL.md`

Cập nhật khi thay đổi:

* database schema;
* entity;
* field;
* relation;
* content model;
* metadata.

### `docs/ROADMAP.md`

Cập nhật:

* phase đã hoàn thành;
* task đã hoàn thành;
* task mới phát sinh;
* quyết định thay đổi roadmap.

Không đánh dấu hoàn thành nếu implementation hoặc test chưa thực sự hoàn tất.

Documentation viết bằng tiếng Việt.

Giữ nguyên các thuật ngữ English khi dịch làm mất nghĩa hoặc gây khó hiểu.

---

# 16. Git

Trước và sau khi sửa phải theo dõi repository.

Sau khi hoàn thành chạy:

```bash
git diff
git status
```

Nếu phù hợp, có thể xem thêm:

```bash
git diff --stat
```

Không commit secret, credential, generated junk hoặc test artifact không cần thiết.

Không tự ý revert commit của người dùng.

Không force push.

Không rewrite history nếu chưa được yêu cầu.

---

# 17. Commit message

Nếu tạo commit hoặc đề xuất commit message:

* viết bằng tiếng Việt;
* giữ nguyên thuật ngữ chuyên ngành bằng English khi phù hợp;
* message ngắn, mô tả đúng thay đổi;
* không dùng nội dung chung chung như `update`, `fix`, `change`.

Ví dụ:

```text
feat: thêm bộ lọc bài viết theo category

fix: sửa lỗi modal không hiển thị trên mobile

refactor: đơn giản hóa xử lý authentication

docs: cập nhật kiến trúc CMS và quy trình deploy
```

Nếu có nhiều thay đổi độc lập, ưu tiên chia thành commit logic thay vì một commit rất lớn.

---

# 18. Validation bắt buộc trước khi kết thúc

Trước khi báo hoàn thành:

1. Chạy validation phù hợp với project.
2. Chạy test liên quan.
3. Build project nếu cần.
4. Test workflow như người dùng thật nếu môi trường cho phép.
5. Kiểm tra `git diff`.
6. Kiểm tra `git status`.
7. Kiểm tra không có secret/debug/test junk.
8. Kiểm tra documentation đã đồng bộ.

Không tuyên bố "hoàn thành" nếu validation đang fail.

Nếu có check không thể chạy, phải nêu rõ:

* check nào chưa chạy;
* lý do;
* rủi ro còn lại;
* cách người dùng tự kiểm tra.

---

# 19. Báo cáo sau khi code

Báo cáo cuối cùng bằng tiếng Việt.

Không cần kể chi tiết mọi thao tác đã làm.

Báo cáo theo cấu trúc:

## Đã làm

Mô tả ngắn gọn functionality hoặc bug đã xử lý.

## Vì sao làm theo cách này

Giải thích ngắn gọn quyết định chính và lý do không dùng giải pháp phức tạp hơn nếu relevant.

## File thay đổi

Liệt kê các file quan trọng:

```text
modified: ...
created: ...
deleted: ...
```

## Database

Ghi rõ:

```text
DB change: Không
```

hoặc mô tả:

* table;
* column;
* migration;
* impact;
* rollback.

## Route

Ghi rõ:

```text
Route mới: Không
```

hoặc liệt kê route mới/thay đổi.

## Dependency / Plugin

Ghi rõ dependency hoặc plugin:

* thêm;
* xóa;
* update;
* cần activate.

Nếu không thay đổi:

```text
Dependency change: Không
Plugin change: Không
```

## Validation

Liệt kê:

* test;
* lint;
* build;
* validation;
* browser test;
* kết quả.

## Cách tự test

Hướng dẫn người dùng reproduce workflow bằng các bước ngắn gọn.

## Deploy / Production

Nếu thay đổi liên quan:

* deploy;
* hosting;
* environment variable;
* WordPress theme;
* WordPress plugin;
* cache;
* migration;

phải hướng dẫn thao tác tiếp theo trên production.

Nếu cần WordPress plugin:

* hướng dẫn cách activate trong `wp-admin`;
* hướng dẫn cấu hình cần thiết;
* hướng dẫn smoke test sau khi activate.

## Git

Báo trạng thái repository và đề xuất commit message.

Ví dụ:

```text
Commit đề xuất:

feat: thêm CMS tạo bài viết và preview
```

---

# 20. Nguyên tắc ra quyết định cuối cùng

Khi có nhiều giải pháp đều hoạt động, ưu tiên theo thứ tự:

1. Không cần code.
2. Tái sử dụng functionality hiện có.
3. Native platform / standard library.
4. Dependency hiện có.
5. Một thay đổi nhỏ trong code hiện tại.
6. Dependency mới.
7. Abstraction hoặc subsystem mới.

Nhưng thứ tự này không được áp dụng máy móc.

Nếu một giải pháp đơn giản hơn gây:

* security risk;
* data loss risk;
* accessibility regression;
* performance problem nghiêm trọng;
* maintenance problem rõ ràng;
* compatibility issue;
* phá requirement;

thì chọn giải pháp an toàn và đúng hơn.

Nguyên tắc quan trọng nhất:

> Viết ít code hơn không phải mục tiêu cuối cùng.
> Mục tiêu là tạo ra giải pháp nhỏ nhất nhưng vẫn đúng, an toàn, dễ hiểu, dễ test và dễ bảo trì.
