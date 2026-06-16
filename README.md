# HTQL Custom Theme

Extension Chrome để tuỳ biến giao diện HTQL CTU — bao gồm trang đăng nhập và trang dashboard sinh viên (`hindex.php`) — theo phong cách glassmorphism hiện đại.

![Ảnh demo giao diện đăng nhập](https://github.com/user-attachments/assets/586e697b-fd18-4ec8-9aeb-eb793fc5dda9)
![Ảnh demo giao diện dashboard](https://github.com/user-attachments/assets/bf7a025f-180f-420e-be13-2e6273446c65)


## Tính năng chính

### Trang đăng nhập
- Làm mờ và bo tròn khung đăng nhập theo phong cách glassmorphism.
- Tuỳ chỉnh màu chữ, màu nút và tông giao diện.
- Đổi độ mờ và độ blur của nền.
- Đổi ảnh nền bằng ảnh có sẵn hoặc ảnh tự tải lên.
- Đồng bộ giao diện thanh thông báo bên phải theo cùng ngôn ngữ thiết kế.

### Trang dashboard sinh viên (hindex.php)
- Thay toàn bộ giao diện gốc bằng dashboard custom glassmorphism.
- **Hero card** hiển thị thông tin sinh viên với bố cục 2 cột:
  - Cột trái: Tên + MSSV (cỡ lớn), Khoa, Ngành.
  - Cột phải: 4 chip thông tin (Ngày sinh, Lớp, Giới tính, Khóa học) xếp lưới 2×2.
- Card cố vấn học tập và thông tin gia đình.
- Lưới chức năng nhanh với 13 mục điều hướng.
- Thanh cuộn ẩn, nền cố định theo viewport.
- Tự động đọc dữ liệu từ bảng HTML gốc, không cần API.

### Popup cấu hình
- Điều chỉnh Glass Opacity và Backdrop Blur qua slider.
- Đổi màu chủ đề và màu chữ với bộ preset có sẵn.
- 3 phương thức thay ảnh nền: upload, URL, preset tích hợp.
- Thay đổi áp dụng real-time không cần tải lại trang.

## Cài đặt

1. Mở Chrome và truy cập `chrome://extensions/`.
2. Bật chế độ `Developer mode` ở góc trên bên phải.
3. Chọn `Load unpacked`.
4. Chọn thư mục repo.
5. Truy cập `https://htql.ctu.edu.vn/` để xem giao diện đăng nhập, hoặc `https://dkmh.ctu.edu.vn/htql/sinhvien/hindex.php` để xem dashboard.

## Cách sử dụng

1. Bấm vào icon extension trên thanh công cụ để mở bảng cấu hình.
2. Chỉnh các thông số trong popup:
   - `Glass Opacity`: độ trong suốt của các card.
   - `Backdrop Blur`: độ mờ nền phía sau.
   - `Màu sắc`: đổi màu chủ đạo và màu chữ.
   - `Ảnh nền`: thay bằng URL, upload từ máy hoặc chọn preset.
3. Mọi thay đổi lưu vào `chrome.storage.local` và tự áp dụng lại khi tải trang.

## Tuỳ chỉnh ảnh nền

3 cách thay ảnh nền:

- Dùng ảnh mặc định đi kèm extension.
- Dán URL ảnh trực tiếp vào ô nhập.
- Tải ảnh từ máy tính lên (tối đa 4.5MB).

## Cấu trúc file

| File | Mô tả |
|------|-------|
| `content.js` | Inject giao diện trang đăng nhập HTQL |
| `hindex.js` | Inject dashboard custom cho trang hindex.php |
| `popup.html` | Giao diện bảng cấu hình |
| `popup.js` | Logic các điều khiển trong popup |
| `background.png` | Ảnh nền mặc định |
| `icon48.png`, `icon128.png` | Icon extension |
| `manifest.json` | Cấu hình extension Chrome |

## Ghi chú kỹ thuật

- `hindex.js` đọc dữ liệu trực tiếp từ các bảng HTML gốc bằng text matching, không cần API.
- Toàn bộ CSS gốc của trang bị vô hiệu hoá và thay bằng stylesheet custom.
- Ảnh nền dùng `background-attachment: fixed` nên không bị kéo theo khi scroll.
- Thanh cuộn được ẩn trên toàn trang (`scrollbar-width: none`, `::-webkit-scrollbar: display none`).
- Màu sắc scrollbar, badge, chip... tự động tính từ `themeColor` được chọn trong popup.

## Lưu ý

- Extension chỉ hoạt động trên các domain được khai báo trong `manifest.json`.
- Nếu CTU thay đổi cấu trúc HTML của trang, có thể cần cập nhật lại selector trong `content.js` hoặc `hindex.js`.
- Reload extension sau khi chỉnh mã nguồn nếu thay đổi không hiển thị.
