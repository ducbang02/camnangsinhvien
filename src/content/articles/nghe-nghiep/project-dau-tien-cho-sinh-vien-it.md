---
title: "Project đầu tiên cho sinh viên IT: nhỏ nhưng phải chạy được"
description: "Cách chọn phạm vi, viết yêu cầu, chia milestone, test và README để project đầu tiên chứng minh tư duy thay vì chỉ clone tutorial."
category: nghe-nghiep
topic: Sinh viên IT
tags: [project IT, portfolio, GitHub, lập trình, internship]
publishedDate: 2026-08-26
updatedDate: 2026-09-14
author: Cẩm nang sinh viên
readingMinutes: 11
---

Project đầu tiên không cần độc đáo. Nó cần có người dùng cụ thể, một luồng hoàn chỉnh và bằng chứng bạn hiểu quyết định của mình.

## Chọn một vấn đề trong tầm hai tuần

Ý tưởng tốt có thể mô tả bằng một câu:

> Dành cho [ai], giúp họ [làm việc gì] bằng [luồng chính], không bao gồm [phạm vi để sau].

Ví dụ: “Ứng dụng web giúp nhóm sinh viên chia tiền chuyến đi, nhập khoản chi và xem ai cần trả ai; chưa có đăng nhập hoặc đồng bộ.”

Tránh bắt đầu bằng “mạng xã hội giống Facebook” hoặc “sàn thương mại điện tử đầy đủ”. Phạm vi lớn khiến bạn chỉ dựng giao diện mà không hoàn thành luồng.

## Viết ba user story

Mỗi story phải quan sát được:

1. Người dùng nhập thành viên.
2. Người dùng thêm khoản chi và người trả.
3. Hệ thống hiển thị số tiền cần cân bằng.

Định nghĩa “xong”: input hợp lệ, trạng thái rỗng, lỗi và reset đều hoạt động; không chỉ happy path.

## Chia milestone theo lát dọc

- **M1:** một luồng chạy bằng dữ liệu cố định.
- **M2:** cho nhập dữ liệu và validate.
- **M3:** lưu/đọc dữ liệu, xử lý empty/error.
- **M4:** responsive, accessibility, test và README.

Lát dọc giúp bạn luôn có phiên bản chạy được. Chia theo “làm toàn bộ database rồi toàn bộ frontend” thường tạo hai nửa chưa kết nối.

## Git phải kể được câu chuyện

Commit theo thay đổi có nghĩa: `Thêm kiểm tra khoản chi âm`, không phải `update`. Dùng branch khi thử tính năng, đọc diff trước commit và không đưa secret vào repository.

Nếu dùng AI tạo code, commit vẫn là trách nhiệm của bạn. Hãy yêu cầu test, đọc từng thay đổi và xóa phần không hiểu.

## README tối thiểu

README trả lời:

- Project giải quyết gì, cho ai?
- Demo hoặc ảnh/luồng chính ở đâu?
- Cách chạy từ máy mới?
- Quyết định kỹ thuật quan trọng và trade-off?
- Hạn chế hiện tại?
- Bạn sẽ làm gì tiếp nếu có thêm thời gian?

Một nhà tuyển dụng dễ đánh giá project có README trung thực hơn repository 30 folder không có hướng dẫn.

## Checklist trước khi đưa vào portfolio

- Clone vào thư mục mới và chạy theo README.
- Không có API key, password hoặc dữ liệu cá nhân trong lịch sử Git.
- Thử input rỗng, dài, sai kiểu và thao tác lặp.
- Kiểm tra trên điện thoại nếu là web.
- Nhờ một người dùng thử mà không hướng dẫn miệng.
- Viết rõ phần bạn làm nếu là project nhóm.

Sau project đầu, đừng vội đổi framework. Chọn một điểm yếu vừa lộ ra—data model, test, UX hay deploy—rồi cải thiện hoặc làm project thứ hai có chủ đích.
