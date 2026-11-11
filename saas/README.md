# ADL Giỏ Hàng: phần mềm quản lý giỏ hàng bất động sản (SaaS)

Phần mềm bán cho sàn, đại lý bất động sản: mỗi đơn vị đăng ký một tài khoản riêng, quản lý giỏ hàng nhiều dự án, đội sale xin giữ căn, quản trị duyệt, và có bảng hàng công khai mang thương hiệu riêng để gửi khách hoặc nhúng lên website.

Phát triển bởi CÔNG TY CỔ PHẦN ĐẦU TƯ Á ĐÔNG LAND (MST 0316796067).

## Tính năng

| Nhóm | Chi tiết |
|---|---|
| Tài khoản | Đăng ký đơn vị (dùng thử 14 ngày), đăng nhập, mời thành viên bằng link, 3 vai trò: Chủ tài khoản, Quản trị, Nhân viên kinh doanh. Một người có thể thuộc nhiều đơn vị. |
| Giỏ hàng | Nhiều dự án; mỗi căn có mã, phân khu, dãy, loại hình, hướng, bàn giao, DT đất, DT xây dựng, giá niêm yết, giá chưa VAT, giá vay, giá TTS, giá TTTĐ, quỹ căn, giỏ độc quyền, phiếu tính giá, ảnh chỉ căn, ghi chú và đối tác (nội bộ). Lọc, sắp xếp, tìm kiếm, đổi tình trạng hàng loạt, tải CSV. |
| Nhập dữ liệu | Dán từ Excel, file CSV, link Google Sheet. Tự tìm dòng tiêu đề, tự nhận cột theo tên (có dấu hay không dấu), đọc số kiểu "10.203.235.501", "8,15 tỷ", "150,4". Xem trước trước khi nhập. Nhập lại chỉ cập nhật căn thay đổi. |
| Đồng bộ Google Sheet | Gắn link sheet vào dự án, tự đồng bộ mỗi 10 phút. Sheet là nguồn chính: căn bị xóa khỏi sheet được gỡ. Sheet lỗi hoặc chưa chia sẻ thì báo lỗi, không xóa dữ liệu. |
| Giữ căn | Sale xin giữ (kèm tên khách) → căn sang Check admin → quản trị duyệt (2 đến 72 giờ) → Đang lock → hết hạn tự trả về Còn hàng. Từ chối, trả căn sớm. |
| Biến động | Nhật ký mọi thay đổi tình trạng, giá, thêm, xóa, nhập dữ liệu, giữ căn: ai làm, lúc nào. |
| Bảng hàng công khai | Trang `/b/<địa-chỉ>` và mã nhúng website, dùng khối bảng hàng của adongland.vn (lọc, chi tiết căn, phiếu tính giá, tính lãi vay, tab thông tin dự án nếu gắn trang WordPress). Tên, màu, logo, hotline, Zalo của từng đơn vị. Chỉ gửi trường an toàn: không ghi chú, đối tác, người giữ căn. Ẩn căn đã bán (tùy chọn). |
| Gói dịch vụ | Dùng thử, Cơ bản, Chuyên nghiệp, Doanh nghiệp; giới hạn dự án, căn, tài khoản. Hết hạn: vẫn xem được, không sửa được; bảng hàng công khai chạy thêm 7 ngày. |
| Thanh toán | Chủ tài khoản chọn gói và thời hạn (trả 12 tháng tính 10), nhận mã QR VietQR có sẵn số tiền và nội dung chuyển khoản. Quản trị hệ thống bấm "Đã nhận tiền" để kích hoạt. |
| Quản trị hệ thống | Danh sách khách hàng, mức sử dụng, doanh thu đã xác nhận, duyệt thanh toán, sửa gói, gia hạn dùng thử, tạm khóa, tạo link đặt lại mật khẩu cho chủ tài khoản. |

## Bảo mật

- Mật khẩu băm bằng scrypt; phiên đăng nhập là mã ngẫu nhiên lưu dạng băm, cookie HttpOnly, SameSite=Lax, Secure khi chạy HTTPS.
- Mọi truy vấn lọc theo đơn vị; kiểm thử xác nhận đơn vị này không đọc, sửa, xóa được dữ liệu đơn vị khác.
- Chống giả mạo yêu cầu (CSRF): bắt buộc tiêu đề `x-gh` và cùng nguồn. Giới hạn số lần đăng nhập sai, số lần đăng ký.
- Content-Security-Policy chặn mã lạ; không dùng `eval`, không chèn HTML chưa thoát ký tự.
- Đồng bộ Google Sheet chỉ gọi tới `docs.google.com` (chặn SSRF).

## Chạy thử trên máy

Cần Node.js 22.5 trở lên. Không cần cài thư viện (không có `npm install`).

```bash
cd saas
SUPERADMIN_EMAILS=ban@congty.vn npm start
# mở http://localhost:8080, đăng ký bằng email trên để có quyền quản trị hệ thống
npm test   # 19 kiểm thử
```

## Đưa lên máy chủ (VPS)

1. Thuê VPS Linux (2 CPU, 2 GB RAM đủ cho vài trăm đơn vị), cài Docker.
2. Trỏ tên miền, ví dụ `giohang.adongland.vn`, về IP máy chủ (bản ghi A). Nếu dùng Cloudflare, để chế độ "DNS only" lúc đầu để Caddy lấy chứng chỉ.
3. Chép thư mục `saas` lên máy chủ, tạo file `.env` từ `.env.example`, điền `DOMAIN` và `SUPERADMIN_EMAILS`.
4. Chạy `docker compose up -d --build`. Caddy tự cấp HTTPS.
5. Mở `https://<tên miền>`, đăng ký bằng email trong `SUPERADMIN_EMAILS`, mục "Quản trị hệ thống" sẽ hiện.
6. Sao lưu mỗi ngày (cron trên máy chủ):
   ```
   15 2 * * * cd /duong-dan/saas && docker compose exec -T app node --no-warnings=ExperimentalWarning scripts/backup.mjs
   ```
   Bản sao lưu nằm trong `data/backups`, giữ 30 bản. Nên chép thêm ra nơi khác (Google Drive, máy khác).

Cấp quyền quản trị hệ thống cho tài khoản đã có: `docker compose exec app node --no-warnings=ExperimentalWarning scripts/superadmin.mjs email@congty.vn`.

## Cấu hình

| Ở đâu | Nội dung |
|---|---|
| `src/config.js` | Tên sản phẩm, bảng giá và giới hạn từng gói (giá hiện là đề xuất), số tháng tính tiền khi trả năm, số ngày ân hạn, tài khoản nhận tiền. |
| `.env` | Tên miền, email quản trị hệ thống, hotline, Zalo hỗ trợ, chu kỳ đồng bộ Sheet. |
| `../docs/embed.js` | Khối bảng hàng công khai. Sửa xong chạy `npm run sync-widget` để chép vào phần mềm. |

## Cấu trúc

```
saas/
  src/config.js     cấu hình sản phẩm, gói, ngân hàng
  src/db.js         lược đồ SQLite (một file dữ liệu)
  src/parse.js      đọc Excel/CSV/Google Sheet
  src/auth.js       mật khẩu, phiên, quyền, gói
  src/http.js       định tuyến, cookie, bảo mật
  src/app.js        toàn bộ API và trang công khai
  src/server.js     khởi động, việc nền (trả căn hết hạn, đồng bộ Sheet)
  public/           trang giới thiệu, điều khoản, bảo mật, ứng dụng quản lý (public/app), khối bảng hàng (public/widget)
  test/             kiểm thử
```

## Giới hạn hiện tại, việc nên làm tiếp

- **Chưa gửi email** (xác nhận đăng ký, quên mật khẩu). Hiện quản trị đơn vị hoặc quản trị hệ thống tạo link đặt lại mật khẩu. Cần một dịch vụ gửi email (SMTP) để tự động hóa.
- **Xác nhận thanh toán thủ công.** Có thể nối webhook ngân hàng hoặc cổng thanh toán (VNPay, MoMo, PayOS) để kích hoạt tự động.
- **Hóa đơn điện tử** xuất ngoài phần mềm.
- **Mã QR** lấy ảnh từ dịch vụ img.vietqr.io (miễn phí); nếu dịch vụ này ngừng, thông tin chuyển khoản vẫn hiện đầy đủ dạng chữ.
- **SQLite một máy chủ**: đủ cho hàng trăm đến vài nghìn đơn vị. Khi lớn hơn chuyển sang PostgreSQL.
- `node:sqlite` của Node 22 còn gắn nhãn thử nghiệm; đã khóa phiên bản Node 22 trong Docker.
- Điều khoản sử dụng, Chính sách bảo mật (`public/dieu-khoan.html`, `public/bao-mat.html`) là **bản nháp**, cần luật sư rà soát trước khi bán.
