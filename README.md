# Giỏ hàng Á Đông Land — phiên bản 4

Web app quản lý và cập nhật giỏ hàng hai dự án **Vinhomes Saigon Park (VHSGP)** và **Vinhomes Green Paradise (VHCG)**.

Google Sheet vẫn là nguồn dữ liệu gốc. App đọc thẳng từ sheet và ghi ngược lại khi admin cập nhật, nên team vẫn làm việc trên sheet như cũ mà không phải nhập liệu hai nơi.

| Dự án | File Google Sheet | Tab dùng làm giỏ hàng |
|---|---|---|
| Vinhomes Saigon Park | `ADL_ GIỎ HÀNG VHSGP` | `GHĐQ ADL` (độc quyền, sửa được), `GIỎ HÀNG ĐỐI TÁC` (chỉ xem) |
| Vinhomes Green Paradise | `ADL - BẢNG HÀNG VHCG` | `GHĐQ` (độc quyền), `GIỎ HÀNG ĐỐI TÁC` (đều sửa được) |

## Có gì mới ở phiên bản 4: giao diện bảng hàng gọn, dễ lọc

- Nền trắng, khung tiêu đề dự án ở đầu trang, menu ở giữa có gạch chân cho mục đang chọn.
- **Bảng hàng** là màn hình mặc định, gồm các cột: Mã căn (ô đỏ) · Giá niêm yết · Giá chưa VAT · Đơn giá (triệu/m² đất) · Loại hình · Hướng · DT đất · DT xây dựng · TCBG · Phân khu · Giỏ · Tình trạng (chấm màu).
  - Cột nào cả dự án đều trống (ví dụ Hướng) sẽ tự ẩn.
  - Màn hình hẹp tự ẩn bớt cột phụ để không phải kéo ngang; xem đủ thông tin trong khung chi tiết căn.
- **Sắp xếp** bằng ô "Sắp xếp" (Mặc định, Giá thấp → cao, Giá cao → thấp, Đơn giá, DT đất, Mã căn, Mới biến động trước) hoặc bấm tiêu đề cột.
  - "Mặc định": căn còn hàng lên đầu, rẻ trước.
- **Bộ lọc**: nút "Bộ lọc" mở bảng lọc theo giỏ, phân khu, loại hình, TCBG, hướng, khoảng giá, căn mới biến động. Nút hiện số bộ lọc đang bật.
- **Lọc nhanh theo tình trạng** bằng hàng nút: Tất cả, Còn hàng, Check admin, Đang lock, Đã cọc, Đã bán (kèm số căn).
- Ô tìm kiếm ngay cạnh tiêu đề "BẢNG HÀNG".
- Nút "Bảng | Sơ đồ" chuyển sang sơ đồ ô màu của bản 3.

## Có gì mới ở phiên bản 3: sơ đồ bảng hàng

- **Sơ đồ trực quan**: mỗi căn là một ô màu theo trạng thái, xếp theo **phân khu → đường/dãy → số căn**. Ô ghi số căn, loại căn, diện tích đất, giá. Căn đã bán gạch ngang.
- Mỗi phân khu có thanh đầu ghi số căn theo trạng thái và tỷ lệ còn hàng; mỗi đường ghi "x/y còn".
- Nhãn trên ô: **MỚI** (vừa biến động), **GIỮ** (đang giữ cho sale), **HẠN** (quá hạn giữ), **YC** (có yêu cầu chờ duyệt). Chấm xám là căn thuộc giỏ chỉ xem.
- **Cập nhật nhanh (admin)**: bật "Cập nhật nhanh", bấm vào ô và chọn trạng thái mới; app lưu ngay vào Google Sheet và hiện nút **Hoàn tác** trong 7 giây.
- **Chọn nhiều căn** ngay trên sơ đồ (bật "Chọn nhiều căn", hoặc giữ Shift/Ctrl khi bấm) để copy tin chào hoặc đổi trạng thái hàng loạt.
- **Ẩn căn đã bán** để bảng gọn; ô thống kê vẫn đếm đủ.
- **Tự cập nhật** mỗi 90 giây; căn vừa đổi nhấp nháy và có thông báo "N căn vừa thay đổi". Bấm "Tự cập nhật" để tắt hoặc bật.
- Ô thống kê tô màu theo trạng thái, bấm để lọc. Chuyển về "Danh sách" để xem dạng bảng như bản 2.

## Có gì mới ở phiên bản 2

| Hạng mục | Bản 1 | Bản 2 |
|---|---|---|
| Đăng nhập admin | Một PIN dùng chung, tên tự gõ | **Mỗi admin một PIN riêng**, nhật ký ghi đúng người sửa |
| Phiên đăng nhập | PIN gửi kèm mỗi lần lưu | Token phiên 6 giờ, đăng xuất được |
| Chống dò PIN | Không có | Sai 8 lần trong 15 phút → khóa đăng nhập 15 phút |
| Bảo vệ dữ liệu xem | Ai có link đều xem (kể cả STK, nhật ký) | Tùy chọn **mã xem** cho sale/CTV; nhật ký chỉ admin xem |
| Giữ căn | Không có | **Sale gửi yêu cầu giữ căn → admin duyệt** (6–72 giờ) → nhả hoặc chuyển Đã cọc |
| Theo dõi biến động | Chỉ ghi sửa trên app | **Phát hiện cả sửa thẳng trên sheet**: căn mới, rút khỏi giỏ, đổi trạng thái, đổi giá |
| Cập nhật | Từng căn | **Chọn nhiều căn, đổi trạng thái một lần** |
| Gửi khách | Copy từng căn | **Copy tin chào nhiều căn**, copy link riêng từng căn |
| Báo cáo | Thống kê tổng | Tab **Tổng quan** theo phân khu, giỏ, loại căn, TCBG; giá/m² đất |
| Lỗi đã sửa | — | Dòng mô tả kiểu "Sắp xếp: Còn hàng → … → Đã bán" không còn bị hiểu nhầm là ô chú thích màu; mã căn trùng trong một tab chỉ lấy dòng đầu; CSV chặn công thức độc hại |

## Tính năng

**Cho sale và CTV**
- Xem giỏ hàng từng dự án, gộp tab độc quyền và đối tác. Nhãn **MỚI** cho căn vừa biến động trong 48 giờ.
- Thống kê nhanh theo trạng thái; bấm vào ô để lọc.
- Lọc theo giỏ, phân khu, loại căn, TCBG, khoảng giá (tỷ), "Mới biến động"; tìm theo mã căn, đường, ghi chú, đối tác, tên sale đang giữ.
- Chi tiết căn: thông số, giá/m² đất, phiếu tính giá, lịch sử biến động, toàn bộ cột gốc.
- **Copy tin chào hàng** một hoặc nhiều căn để gửi Zalo; **Copy link căn** mở thẳng căn đó.
- **Gửi yêu cầu giữ căn** (tên, SĐT sale, khách hàng). App chặn hai sale cùng xin một căn.
- Tab **Biến động** 7 ngày, **Tổng quan**, **Thông tin cọc** (STK ký quỹ, quỹ VOS, hạn bàn giao). Xuất CSV.

**Cho admin**
- Sửa Tình trạng, Ghi chú, Ngày từng căn hoặc **hàng loạt**; ghi thẳng vào Google Sheet.
- Tab **Yêu cầu giữ căn**: duyệt (chọn số giờ giữ), từ chối, nhả căn, chuyển sang Đã cọc. Căn quá hạn giữ được tô đỏ và đếm trên huy hiệu.
- Tab **Nhật ký**: ai sửa gì, lúc nào, giá trị cũ và mới.

### Các tab app tự tạo trong file Google Sheet

| Tab | Nội dung |
|---|---|
| `LOG CẬP NHẬT APP` | Mỗi thay đổi admin làm trên app |
| `BIẾN ĐỘNG GIỎ HÀNG` | Căn mới, rút khỏi giỏ, đổi trạng thái, đổi giá (từ app hoặc sửa thẳng trên sheet) |
| `YÊU CẦU GIỮ CĂN` | Yêu cầu của sale và kết quả xử lý |
| `_APP_SNAPSHOT` (ẩn) | Ảnh chụp giỏ hàng để so sánh biến động. **Không sửa tay.** |

### Cách app đọc sheet

- Tự tìm dòng tiêu đề (dòng có cột "Mã căn"), nên chèn thêm dòng thông tin phía trên hay đổi thứ tự cột không làm hỏng app.
- Nhận diện cột theo tên (`Mã căn mới`, `Khu`, `Loại căn`, `TCBG mới`, `DT đất`, `Giá gồm VAT và KPBT`, `TÌNH TRẠNG`, `GHI CHÚ`, `Link PTG`…). Danh sách nằm trong `FIELD_ALIASES` ở `Config.gs`.
- **Tab đánh dấu trạng thái bằng màu** (như `GHĐQ ADL` có ô "ĐÃ BÁN", "ĐANG LOCK" ở dòng 2): app đọc màu nền của ô mã căn và so với màu chú thích; khi đổi trạng thái thì tô màu cả dòng. Muốn dùng đủ 5 trạng thái cho tab này, thêm một cột `TÌNH TRẠNG`.
- Dòng nhóm (ví dụ "PHÂN KHU VỊNH NGỌC") được dùng làm phân khu cho các căn bên dưới nếu cột Khu để trống.

### An toàn dữ liệu

- Không sửa giá trên app; ô có công thức không bị ghi đè.
- Người khác vừa đổi trạng thái căn → app báo, yêu cầu tải lại thay vì ghi đè.
- Không duyệt giữ căn đã cọc hoặc đã bán.
- Sheet bị chèn hoặc xóa dòng → app tìm lại căn theo mã trước khi ghi.
- Ghi tuần tự bằng khóa để hai người lưu cùng lúc không đè nhau.
- Tab đang lỗi (mất tab, đổi tên) không bị báo nhầm là "rút khỏi giỏ" hàng loạt.

## Bản đang chạy

- Dự án Apps Script: **Giỏ hàng Á Đông Land**, tạo ngày 04/11/2026 trên tài khoản `tranductuan06@gmail.com`. Mở để sửa tại `https://script.google.com/d/1dQF-b0wb7FiatIk102i5If10gvQzCI4WYGik-AG23-wN_89Q0IamweX6/edit`.
- Lần triển khai @1 "v4.0 - Bảng hàng": web app chạy dưới tài khoản trên, người dùng cần đăng nhập Google để mở.
- Link web app (`.../exec`) xem trong dự án: **Triển khai → Quản lý các lần triển khai**. Không ghi link vào repo để tránh lộ giỏ hàng.
- Cập nhật bản mới bằng clasp: tạo `apps-script/.clasp.json` với `{"scriptId": "1dQF-b0wb7FiatIk102i5If10gvQzCI4WYGik-AG23-wN_89Q0IamweX6", "rootDir": "."}`, chạy `clasp push`, rồi `clasp update-deployment <deploymentId>` để giữ nguyên link.

## Triển khai (khoảng 10 phút)

1. Vào <https://script.google.com>, chọn **Dự án mới**, đặt tên "Giỏ hàng ADL".
2. Tạo các tệp và dán nội dung từ thư mục `apps-script/`:
   - `Code.gs`, `Config.gs` (Tệp → + → Tập lệnh)
   - `Index.html` (Tệp → + → HTML, đặt tên `Index`)
3. Bật hiển thị manifest (⚙ Cài đặt dự án → "Hiển thị tệp kê khai appsscript.json") rồi dán `appsscript.json`.
4. **Đặt quyền truy cập**: mở `Code.gs`, trong hàm `setupAccess` sửa danh sách admin và mã PIN (mỗi người một mã, ít nhất 6 số), điền `viewPin` nếu muốn sale/CTV phải nhập mã xem. Chọn hàm `setupAccess` → **Chạy** → cấp quyền. Sau đó **xóa các PIN khỏi mã** (thay bằng `'xxxxxx'`) để không lộ khi chia sẻ dự án.
5. **Triển khai** → **Tùy chọn triển khai mới** → loại **Ứng dụng web**:
   - Thực thi dưới dạng: **Tôi** (tài khoản có quyền sửa 2 file sheet)
   - Người có quyền truy cập: **Bất kỳ ai**
6. Copy URL `/exec` và gửi cho team.

Khi sửa mã hoặc cấu hình: **Triển khai → Quản lý các lần triển khai → Chỉnh sửa → Phiên bản mới** để giữ nguyên URL.

**Nâng cấp từ bản 1:** dán đè 4 tệp, chạy `setupAccess` một lần (PIN cũ `ADMIN_PIN` sẽ được thay), rồi triển khai phiên bản mới. Lần mở đầu tiên app chỉ chụp ảnh giỏ hàng; biến động được ghi từ lần tải sau.

### Triển khai bằng clasp (tùy chọn)

```bash
npm i -g @google/clasp && clasp login
cd apps-script
clasp create --type webapp --title "Giỏ hàng ADL" --rootDir .
clasp push && clasp deploy
```

## Cấu hình

Mọi thiết lập nằm trong `apps-script/Config.gs`:

- Thêm hoặc bớt tab giỏ hàng: `sources` của từng dự án (`editable`, `enabled`).
- Thêm dự án mới: thêm một phần tử vào `projects` với `spreadsheetId` của file sheet.
- Bảng tham khảo ở tab "Thông tin cọc": `references`.
- Thời hạn giữ căn mặc định (`lockHours`), số ngày biến động (`feedDays`), nhãn MỚI (`recentHours`).
- File VHSGP còn có tab `VHCG ADL` (giỏ độc quyền Green Paradise). Nếu tab đó còn dùng, bỏ dấu `//` ở dòng mẫu trong cấu hình VHCG.

## Xem thử không cần Google

Mở trực tiếp `apps-script/Index.html` bằng trình duyệt. App chạy với **dữ liệu mẫu**; PIN admin thử: `000000`.
