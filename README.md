# HTQL Custom Theme

Extension Chrome tùy biến giao diện hệ thống HTQL – Trường Đại học Cần Thơ theo phong cách glassmorphism hiện đại. Bao gồm trang đăng nhập, dashboard sinh viên (`hindex.php`) và toàn bộ module kế hoạch học tập (`sindex.php`).

![Ảnh demo giao diện đăng nhập](https://github.com/user-attachments/assets/586e697b-fd18-4ec8-9aeb-eb793fc5dda9)
![Ảnh demo giao diện dashboard](https://github.com/user-attachments/assets/ce9a0309-ff6c-4644-b3d6-687b1e99f506)

---

## Tính năng

### Trang đăng nhập (`htql.ctu.edu.vn` / `accounts.ctu.edu.vn`)
- Bo tròn, làm mờ khung đăng nhập theo glassmorphism.
- Đổi màu chữ, màu nút, tông giao diện.
- Tùy chỉnh độ mờ và blur nền.
- Hỗ trợ ảnh nền tĩnh (PNG, JPG, WebP, GIF), video (MP4, WebM) và URL.
- Đồng bộ giao diện thanh thông báo bên phải.

### Dashboard sinh viên (`hindex.php`)
- Thay toàn bộ giao diện gốc bằng dashboard glassmorphism custom.
- **Hero card** 2 cột: tên + MSSV cỡ lớn, 4 chip thông tin (Ngày sinh, Lớp, Giới tính, Khóa học).
- **Card cố vấn học tập** lưới 2×2 (Mã cán bộ, Họ tên, Email, Điện thoại).
- Card thông tin gia đình và lưới 13 chức năng nhanh.
- Logo CTU trên thanh điều hướng, thanh cuộn ẩn, nền video/ảnh cố định viewport.
- Đọc dữ liệu trực tiếp từ HTML gốc, không cần API.

### Module kế hoạch học tập (`sindex.php`)

Giao diện được tùy biến toàn bộ cho các trang con:

| Trang | Mô tả |
|-------|-------|
| `sindex.php` (base) | Bảng kế hoạch học tập theo học kỳ — STT, Năm học, TC cho phép, TC đã nhập |
| `?mID=S101` | KHHT toàn khóa — hỗ trợ **2 chế độ hiển thị**: dạng bảng nhóm theo học kỳ hoặc dạng đồ thị timeline cluster |
| `?mID=S301` | Danh sách học phần đã nhập — lọc theo năm học/học kỳ, nút thêm/xóa |
| `?mID=S3011` | Thêm học phần từ CTDT — tìm kiếm, phân trang, chọn năm học/học kỳ theo hàng |
| `?mID=S3012` | Thêm học phần ngoài CTDT |
| `?mID=S3013` | Thêm học phần cải thiện điểm |
| `?mID=S401` | Cập nhật năm học – học kỳ |
| `?mID=S601` | Thông tin họp lớp |

**Dạng đồ thị S101 (KHHT toàn khóa):**
- Mỗi học kỳ là một cluster node nằm xen kẽ trái/phải.
- Mỗi học phần là một "lá" kết nối với node qua đường SVG.
- Hiệu ứng **học phần lơ lửng** (gravity float) và **hover tương tác** — bật/tắt được trong popup.
- Nút In / Xuất ra file.

### Popup cấu hình (6 tab)

| Tab | Chức năng |
|-----|-----------|
| **Glass** | Điều chỉnh Glass Opacity và Backdrop Blur; preset nhanh 4 mức (Trong nhẹ / Cân bằng / Đục mờ / Rõ ràng); chọn màu kính (Glass Tint) |
| **Màu sắc** | Màu chủ đề, màu chữ (2 cột), màu nhãn trường thông tin (full width); mỗi trường có bộ preset dots |
| **Font** | 11 font Google Fonts: Plus Jakarta Sans, Inter, Be Vietnam Pro, Nunito, Lexend, DM Sans, Outfit, Roboto, Space Grotesk, Sora, Manrope |
| **Bố cục** | Chọn kiểu hiển thị trang KHHT toàn khóa: **Dạng bảng** hoặc **Dạng đồ thị** |
| **Hiệu ứng** | Bật/tắt hiệu ứng học phần lơ lửng và hover chuột trên S101 |
| **Ảnh nền** | Upload ảnh (≤4.5MB) hoặc video (≤50MB), dán URL, chọn preset thumbnail (4 cột), đặt màu nền solid |

- Popup rộng 480px, thanh cuộn ẩn.
- Tất cả thay đổi lưu vào `chrome.storage.local` và áp dụng real-time không cần tải lại trang.

---

## Cài đặt

1. Mở Chrome → `chrome://extensions/`.
2. Bật **Developer mode** (góc trên phải).
3. Chọn **Load unpacked** → chọn thư mục repo.
4. Truy cập một trong các URL được hỗ trợ để xem giao diện.

**URL được hỗ trợ:**
- `https://htql.ctu.edu.vn/` — trang đăng nhập
- `https://accounts.ctu.edu.vn/` — trang đăng nhập SSO
- `https://dkmh.ctu.edu.vn/htql/sinhvien/hindex.php` — dashboard
- `https://dkmh.ctu.edu.vn/htql/sinhvien/ctdt/codes/sindex.php` — kế hoạch học tập

---

## Cách sử dụng

1. Bấm icon extension trên thanh công cụ để mở popup.
2. Chỉnh theo 6 tab:
   - **Glass** — kéo slider opacity/blur hoặc chọn preset nhanh; chọn màu tint cho hiệu ứng kính.
   - **Màu sắc** — click swatch hoặc dot để đổi màu chủ đề, màu chữ, màu nhãn.
   - **Font** — click chọn một trong 11 font.
   - **Bố cục** — chọn kiểu hiển thị KHHT toàn khóa (bảng / đồ thị).
   - **Hiệu ứng** — bật/tắt hiệu ứng học phần lơ lửng và hover.
   - **Ảnh nền** — upload file, dán URL, chọn preset hoặc đặt màu solid.
3. Mọi thay đổi tự động lưu và áp dụng ngay.

---

## Cấu trúc file

| File | Mô tả |
|------|-------|
| `content.js` | Inject giao diện trang đăng nhập |
| `hindex.js` | Inject dashboard custom cho `hindex.php` |
| `shared.js` | Thư viện dùng chung: SVG icons, header HTML/CSS, setup actions |
| `sindex.js` | Inject giao diện toàn bộ module kế hoạch học tập (`sindex.php` và các `?mID=`) |
| `popup.html` | Giao diện popup cấu hình (6 tab) |
| `popup.js` | Logic điều khiển popup và lưu settings |
| `background.png` | Ảnh nền mặc định |
| `logo.png` | Logo CTU |
| `icon48.png`, `icon128.png` | Icon extension |
| `manifest.json` | Cấu hình extension Chrome MV3 (v1.4) |

---

## Ghi chú kỹ thuật

- CSS gốc bị vô hiệu hóa hoàn toàn khi trang load; stylesheet custom inject thay thế.
- Trang bị ẩn (`visibility: hidden`) trong lúc chờ `chrome.storage.local` callback để tránh flash.
- Nền video dùng `<video>` tag inject vào DOM, tự pause khi ẩn tab (`visibilitychange`).
- Đồ thị S101 dùng absolute positioning + SVG lines tính toán bằng JS sau khi DOM render xong.
- `headingColor` điều khiển màu nhãn trường thông tin, độc lập với màu chủ đề.
- `s101View` (`'graph'` | `'table'`) lưu trong `chrome.storage.local`, đồng bộ giữa popup và trang.
- Thanh cuộn ẩn toàn bộ: `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`.
- Font load qua một `@import` duy nhất gồm tất cả 11 font, tránh request thừa.
- 2 nút Trang chủ / Thoát dùng `transform: translateZ(0)` + `isolation: isolate` để tránh chớp khi hover nav do repaint `backdrop-filter`.

## Lưu ý

- Extension chỉ hoạt động trên các domain khai báo trong `manifest.json`.
- Nếu CTU thay đổi cấu trúc HTML, cần cập nhật selector trong `content.js`, `hindex.js` hoặc `sindex.js`.
- Reload extension sau khi sửa mã nguồn nếu thay đổi không hiển thị.
