# Giỏ hàng Á Đông Land

Web app quản lý và cập nhật giỏ hàng hai dự án **Vinhomes Saigon Park (VHSGP)** và **Vinhomes Green Paradise (VHCG)**.

Google Sheet vẫn là nguồn dữ liệu gốc. App đọc thẳng từ sheet và ghi ngược lại khi admin cập nhật, nên team vẫn làm việc trên sheet như cũ mà không phải nhập liệu hai nơi.

| Dự án | File Google Sheet | Tab dùng làm giỏ hàng |
|---|---|---|
| Vinhomes Saigon Park | `ADL_ GIỎ HÀNG VHSGP` | `GHĐQ ADL` (độc quyền, sửa được), `GIỎ HÀNG ĐỐI TÁC` (chỉ xem) |
| Vinhomes Green Paradise | `ADL - BẢNG HÀNG VHCG` | `GHĐQ` (độc quyền), `GIỎ HÀNG ĐỐI TÁC` (đều sửa được) |

## Tính năng

- **Xem giỏ hàng theo dự án**: gộp các tab độc quyền và đối tác trong cùng một bảng.
- **Thống kê nhanh**: tổng căn, còn hàng, check admin, đang lock, đã cọc, đã bán, khoảng giá căn còn hàng. Bấm vào ô thống kê để lọc theo trạng thái.
- **Bộ lọc**: tìm mã căn, đường, ghi chú, đối tác; lọc theo giỏ, phân khu, loại căn, TCBG, khoảng giá (tỷ). Bấm tiêu đề cột để sắp xếp.
- **Chi tiết căn**: đủ thông số, link phiếu tính giá, toàn bộ cột gốc trong sheet.
- **Copy tin chào hàng**: một nút tạo sẵn đoạn giới thiệu căn để gửi Zalo.
- **Cập nhật (admin)**: đổi Tình trạng, Ghi chú, Ngày rồi lưu thẳng vào Google Sheet.
- **Thông tin cọc & tham khảo**: xem nhanh STK ký quỹ, quỹ VOS, hạn bàn giao.
- **Nhật ký**: mọi thay đổi qua app được ghi vào tab `LOG CẬP NHẬT APP` (thời gian, người sửa, giá trị cũ và mới).
- **Xuất CSV** danh sách đang lọc. Giao diện dùng được trên điện thoại.

### Cách app đọc sheet

- Tự tìm dòng tiêu đề (dòng có cột "Mã căn"), nên chèn thêm dòng thông tin phía trên hay đổi thứ tự cột không làm hỏng app.
- Nhận diện cột theo tên: `Mã căn mới`, `Khu`, `Đường`, `Loại căn`, `TCBG mới`, `DT đất`, `DTXD`, `STK`, `Đối tác`, `Giá gồm VAT và KPBT`, `TÌNH TRẠNG`, `GHI CHÚ`, `NGÀY CHIA GIỎ`, `Link PTG`… Danh sách tên cột nằm trong `FIELD_ALIASES` ở `Config.gs`.
- **Tab đánh dấu trạng thái bằng màu** (như `GHĐQ ADL` có ô chú thích "ĐÃ BÁN", "ĐANG LOCK" ở dòng 2): app đọc màu nền của ô mã căn và so với màu chú thích. Khi admin đổi trạng thái, app tô màu cả dòng theo đúng màu chú thích; chọn "Còn hàng" thì xóa màu. Muốn dùng đủ 5 trạng thái cho tab này, chỉ cần thêm một cột `TÌNH TRẠNG`.
- Dòng nhóm (ví dụ "PHÂN KHU VỊNH NGỌC") được dùng làm phân khu cho các căn bên dưới nếu cột Khu để trống.

### An toàn dữ liệu

- Chỉ sửa được Tình trạng, Ghi chú, Ngày. **Không sửa giá** trên app vì cột giá thường là công thức.
- Ô có công thức sẽ không bị ghi đè.
- Nếu người khác vừa đổi trạng thái căn đó, app báo và yêu cầu tải lại thay vì ghi đè.
- Nếu sheet bị chèn hoặc xóa dòng, app tìm lại căn theo mã căn trước khi ghi.
- Ghi tuần tự bằng khóa (LockService) để hai người lưu cùng lúc không đè nhau.

## Triển khai (khoảng 10 phút)

1. Vào <https://script.google.com>, chọn **Dự án mới**, đặt tên "Giỏ hàng ADL".
2. Tạo 3 tệp và dán nội dung từ thư mục `apps-script/`:
   - `Code.gs` và `Config.gs` (Tệp → + → Tập lệnh)
   - `Index.html` (Tệp → + → HTML, đặt tên `Index`)
3. Bật hiển thị manifest (⚙ Cài đặt dự án → "Hiển thị tệp kê khai appsscript.json") rồi dán `appsscript.json`.
4. **Đặt mã PIN admin**: mở `Code.gs`, sửa `var pin = '123456'` trong hàm `setAdminPin` thành PIN riêng, chọn hàm `setAdminPin` → **Chạy** → cấp quyền. Sau đó đổi lại dòng đó thành giá trị bất kỳ để PIN không nằm trong mã.
5. **Triển khai** → **Tùy chọn triển khai mới** → loại **Ứng dụng web**:
   - Thực thi dưới dạng: **Tôi** (tài khoản có quyền sửa 2 file sheet)
   - Người có quyền truy cập: **Bất kỳ ai** (gửi link cho sale và CTV) hoặc **Bất kỳ ai có Tài khoản Google**
6. Copy URL `/exec` và gửi cho team. Sale chỉ xem; admin bấm "Đăng nhập admin", nhập tên và PIN để cập nhật.

Khi sửa mã hoặc cấu hình: **Triển khai → Quản lý các lần triển khai → Chỉnh sửa → Phiên bản mới** để giữ nguyên URL.

### Triển khai bằng clasp (tùy chọn)

```bash
npm i -g @google/clasp && clasp login
cd apps-script
clasp create --type webapp --title "Giỏ hàng ADL" --rootDir .
clasp push && clasp deploy
```

## Cấu hình

Mọi thiết lập nằm trong `apps-script/Config.gs`:

- Thêm hoặc bớt tab giỏ hàng: sửa `sources` của từng dự án (`editable`, `enabled`).
- Thêm dự án mới: thêm một phần tử vào `projects` với `spreadsheetId` của file sheet.
- Bảng tham khảo hiển thị ở tab "Thông tin cọc": sửa `references`.
- File VHSGP còn có tab `VHCG ADL` (giỏ độc quyền Green Paradise). Nếu tab đó còn dùng, bỏ dấu `//` ở dòng mẫu trong cấu hình VHCG.

## Xem thử không cần Google

Mở trực tiếp `apps-script/Index.html` bằng trình duyệt. App tự chạy với **dữ liệu mẫu** (PIN thử: `123456`) để xem giao diện và luồng cập nhật.
