# HTQL Custom Theme

Extension Chrome để tuỳ biến giao diện HTQL CTU — bao gồm trang đăng nhập và trang dashboard sinh viên (`hindex.php`) — theo phong cách glassmorphism hiện đại.

![Ảnh demo giao diện đăng nhập](https://github.com/user-attachments/assets/586e697b-fd18-4ec8-9aeb-eb793fc5dda9)
![Ảnh demo giao diện dashboard](https://github.com/user-attachments/assets/ce9a0309-ff6c-4644-b3d6-687b1e99f506)

## Tính năng chính

### Trang đăng nhập
- Làm mờ và bo tròn khung đăng nhập theo phong cách glassmorphism.
- Tuỳ chỉnh màu chữ, màu nút và tông giao diện.
- Đổi độ mờ và độ blur của nền.
- Hỗ trợ ảnh nền tĩnh (PNG, JPG, WebP, GIF), video (MP4, WebM) và URL.
- Đồng bộ giao diện thanh thông báo bên phải theo cùng ngôn ngữ thiết kế.

### Trang dashboard sinh viên (hindex.php)
- Thay toàn bộ giao diện gốc bằng dashboard custom glassmorphism.
- **Hero card** bố cục 2 cột:
  - Cột trái: Tên + MSSV (cỡ lớn), Khoa, Ngành.
  - Cột phải: 4 chip thông tin (Ngày sinh, Lớp, Giới tính, Khóa học) xếp lưới 2×2.
- **Card cố vấn học tập** bố cục lưới 2×2 (Mã cán bộ, Họ tên, Email, Điện thoại).
- Card thông tin gia đình và lưới chức năng nhanh 13 mục.
- Logo CTU hiển thị trên thanh điều hướng.
- Thanh cuộn ẩn, nền video/ảnh cố định theo viewport.
- Tự động đọc dữ liệu từ bảng HTML gốc, không cần API.

### Popup cấu hình (5 tab)

| Tab | Chức năng |
|-----|-----------|
| **Glass** | Điều chỉnh Glass Opacity và Backdrop Blur, preset nhanh 4 mức |
| **Màu sắc** | Màu chủ đề, màu chữ, màu nhãn trường thông tin — mỗi trường có bộ preset dots riêng |
| **Font** | Chọn font chữ từ 8 lựa chọn Google Fonts |
| **Hiệu ứng** | Bật/tắt hiệu ứng gravity cho lá học phần, hover tương tác và khung mở rộng cho hiệu ứng mới |
| **Ảnh nền** | Upload ảnh/video, dán URL, chọn preset tích hợp |

- Mọi thay đổi lưu vào `chrome.storage.local` và áp dụng real-time không cần tải lại trang.

## Cài đặt

1. Mở Chrome và truy cập `chrome://extensions/`.
2. Bật chế độ **Developer mode** ở góc trên bên phải.
3. Chọn **Load unpacked**.
4. Chọn thư mục repo.
5. Truy cập `https://htql.ctu.edu.vn/` để xem trang đăng nhập, hoặc `https://dkmh.ctu.edu.vn/htql/sinhvien/hindex.php` để xem dashboard.


## Cách sử dụng

1. Bấm vào icon extension trên thanh công cụ để mở popup cấu hình.
2. Chỉnh các thông số theo 5 tab:
   - **Glass**: kéo slider để đổi độ trong suốt và blur, hoặc chọn preset nhanh.
   - **Màu sắc**: click swatch hoặc chọn dot màu để đổi màu chủ đề, màu chữ, màu nhãn.
   - **Font**: click chọn font chữ từ danh sách 8 font.
   - **Hiệu ứng**: bật/tắt hiệu ứng gravity và hover cho lá học phần, sẵn khung để thêm hiệu ứng mới.
   - **Ảnh nền**: upload file (ảnh ≤4.5MB, video ≤50MB), dán URL, hoặc chọn preset.
3. Tất cả thay đổi tự động lưu và áp dụng ngay lập tức.

## Tuỳ chỉnh nền video

- Hỗ trợ MP4, WebM tối đa 50MB.
- Video tự động phát, lặp, tắt tiếng.
- Tạm dừng khi chuyển tab để tiết kiệm CPU/GPU.
- Render trên GPU compositor layer riêng (`will-change: transform`).

## Cấu trúc file

| File | Mô tả |
|------|-------|
| `content.js` | Inject giao diện trang đăng nhập HTQL |
| `hindex.js` | Inject dashboard custom cho trang hindex.php |
| `popup.html` | Giao diện popup cấu hình (4 tab) |
| `popup.js` | Logic điều khiển popup và lưu settings |
| `background.png` | Ảnh nền mặc định |
| `logo.png` | Logo CTU hiển thị trên dashboard |
| `icon48.png`, `icon128.png` | Icon extension |
| `manifest.json` | Cấu hình extension Chrome (v1.4) |

## Ghi chú kỹ thuật

- `hindex.js` đọc dữ liệu trực tiếp từ bảng HTML gốc bằng text matching, không cần API.
- Toàn bộ CSS gốc bị vô hiệu hoá và thay bằng stylesheet custom khi trang load.
- Trang bị ẩn (`visibility: hidden`) trong lúc chờ storage callback để tránh flash nền.
- Nền video dùng `<video>` tag inject vào DOM, không dùng CSS background.
- Thanh cuộn ẩn toàn trang (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`).
- Font được load qua một `@import` duy nhất gồm tất cả 8 font, tránh load thừa.
- `headingColor` điều khiển màu nhãn các trường thông tin (`.htql-hindex-meta-label`), độc lập với màu chủ đề.

## Lưu ý

- Extension chỉ hoạt động trên các domain khai báo trong `manifest.json`.
- Nếu CTU thay đổi cấu trúc HTML, cần cập nhật selector trong `content.js` hoặc `hindex.js`.
- Reload extension sau khi chỉnh mã nguồn nếu thay đổi không hiển thị.
