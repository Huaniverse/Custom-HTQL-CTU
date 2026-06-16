# HTQL Custom Theme

Extension Chrome để tuỳ biến giao diện đăng nhập HTQL CTU theo phong cách glassmorphism, đổi màu chủ đạo, đổi độ mờ nền và thay ảnh nền.

![Ảnh demo giao diện đăng nhập](https://github.com/user-attachments/assets/4ee5f41d-f59e-477d-8f68-ff535413a26e)

## Tính năng chính

- Làm mờ và bo tròn khung đăng nhập theo phong cách glassmorphism.
- Tuỳ chỉnh màu chữ, màu nút và tông giao diện.
- Đổi độ mờ và độ blur của nền.
- Đổi ảnh nền bằng ảnh có sẵn hoặc ảnh tự tải lên.
- Ẩn các thành phần giao diện gốc không cần thiết để tập trung vào form đăng nhập.
- Đồng bộ giao diện thông báo bên phải theo cùng ngôn ngữ thiết kế.

## Cài đặt

1. Mở Chrome và truy cập `chrome://extensions/`.
2. Bật chế độ `Developer mode` ở góc trên bên phải.
3. Chọn `Load unpacked`.
4. Chọn thư mục repo.
5. Mở trang `https://htql.ctu.edu.vn/` hoặc `https://accounts.ctu.edu.vn/` để xem giao diện đã được áp dụng.

## Cách sử dụng

1. Bấm vào icon extension trên thanh công cụ để mở bảng cấu hình.
2. Chỉnh các thông số trong popup:
   - `Glass Opacity`: độ trong suốt của khung đăng nhập.
   - `Backdrop Blur`: độ mờ nền phía sau.
   - `Màu sắc`: đổi màu chủ đạo và màu chữ.
   - `Ảnh nền`: thay bằng URL hoặc ảnh upload từ máy.
3. Mọi thay đổi sẽ được lưu vào `chrome.storage.local` và tự áp dụng lại khi tải trang.

## Tuỳ chỉnh ảnh nền

Bạn có 3 cách thay ảnh nền:

- Dùng ảnh mặc định đi kèm extension.
- Dán URL ảnh trực tiếp vào phần nhập ảnh nền.
- Tải ảnh từ máy tính lên bằng nút upload.

## Demo giao diện

Ảnh bên dưới minh hoạ bố cục thực tế:

- Khung đăng nhập nằm chính giữa phần nội dung.
- Khi có sidebar thông báo bên phải, khung đăng nhập tự lùi sang trái nếu cần.
- Thanh cuộn được ẩn để giao diện gọn hơn.

## Cấu trúc file

- `content.js`: inject và thay đổi giao diện trang HTQL.
- `popup.html`: giao diện bảng cấu hình.
- `popup.js`: logic cho các điều khiển trong popup.
- `background.png`: ảnh nền mặc định.
- `icon48.png`, `icon128.png`: icon extension.
- `manifest.json`: cấu hình extension.

## Lưu ý

- Extension chỉ hoạt động trên các domain được khai báo trong `manifest.json`.
- Nếu CTU thay đổi cấu trúc HTML/CSS của trang đăng nhập, có thể cần cập nhật lại selector trong `content.js`.
- Một số trình duyệt có thể cần reload extension sau khi chỉnh mã nguồn.

## Ghi chú kỹ thuật

- Giao diện đăng nhập được canh giữa bằng CSS cố định theo viewport.
- Sidebar thông báo bên phải được giữ đồng bộ với phong cách glassmorphism.
- Scrollbar được ẩn để tránh làm xô lệch bố cục.

