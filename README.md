# Giỏ hàng Á Đông Land — phiên bản 4.2

Web app quản lý và cập nhật giỏ hàng hai dự án **Vinhomes Saigon Park (VHSGP)** và **Vinhomes Green Paradise (VHCG)**.

Google Sheet vẫn là nguồn dữ liệu gốc. App đọc thẳng từ sheet và ghi ngược lại khi admin cập nhật, nên team vẫn làm việc trên sheet như cũ mà không phải nhập liệu hai nơi.

| Dự án | File Google Sheet | Tab dùng làm giỏ hàng |
|---|---|---|
| Vinhomes Saigon Park | `ADL_ GIỎ HÀNG VHSGP` | `GHĐQ ADL` (độc quyền, sửa được), `GIỎ HÀNG ĐỐI TÁC` (chỉ xem) |
| Vinhomes Green Paradise | `ADL - BẢNG HÀNG VHCG` | `GHĐQ` (độc quyền), `GIỎ HÀNG ĐỐI TÁC` (đều sửa được) |

## Phần mềm bán ra thị trường (thư mục `saas/`)

**ADL Giỏ Hàng**: bản SaaS nhiều khách hàng, mỗi sàn hoặc đại lý một tài khoản riêng. Gồm quản lý giỏ hàng, giữ căn, nhập Excel và Google Sheet, bảng hàng công khai mang thương hiệu riêng, gói dịch vụ và thanh toán chuyển khoản. Hướng dẫn chạy và triển khai: [saas/README.md](saas/README.md).

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

## Website bảng hàng công khai cho khách (thư mục `docs/`)

Trang riêng cho khách hàng, đặt trên GitHub Pages. Dữ liệu lấy trực tiếp từ Google Sheet qua một dự án Apps Script công khai.

- **Khách thấy:** mã căn, giá niêm yết (gồm VAT và KPBT), đơn giá triệu/m² đất, loại hình, hướng, diện tích đất, diện tích xây dựng, bàn giao, phân khu, tình trạng (Còn hàng / Đang giữ chỗ).
- **Không bao giờ lộ:** STK, ghi chú nội bộ, đối tác, tên giỏ, người giữ căn, link phiếu tính giá. Căn đã bán bị ẩn (`publicSite.showSold` trong `Config.gs`).
- Có tìm kiếm, sắp xếp, bộ lọc (phân khu, loại hình, hướng, bàn giao, diện tích, khoảng giá), lọc nhanh theo tình trạng.
- Bấm một căn để xem chi tiết. Nút **Gọi hotline**, **Hỏi căn này qua Zalo** (tự sao chép tin nhắn có mã căn), **Sao chép link căn**.
- Tự làm mới mỗi 2 phút. Chữ trên trang theo quy chuẩn thương hiệu: hotline 0901 30 30 92, giá ghi rõ là giá tham khảo có ngày cập nhật.
- Xem thử bằng dữ liệu minh họa: mở `docs/index.html?demo=1`.

**Cách dựng**

1. Dự án Apps Script công khai gồm `Code.gs`, `Config.gs` (lấy từ `apps-script/`), cùng `PublicOnly.gs` và `appsscript.json` trong `public-script/`. Triển khai web app với quyền **Bất kỳ ai, kể cả ẩn danh**. Nhờ file `PublicOnly.gs`, dự án này chỉ trả dữ liệu đã lọc qua `?api=public`, không mở app quản lý.
2. Trong trình soạn thảo của dự án công khai, chạy hàm `kiemTraBangHangCongKhai` một lần để cấp quyền đọc Sheet.
3. Dán link `/exec` của dự án công khai vào `API_URL` trong `docs/config.js`.
4. Bật GitHub Pages: repo **Settings → Pages → Build and deployment → Deploy from a branch**, chọn nhánh chứa thư mục `docs` và thư mục `/docs`.
5. Muốn dùng tên miền riêng (ví dụ `banghang.adongland.vn`): nhập vào ô **Custom domain** trong trang Pages, rồi tạo bản ghi CNAME trỏ về `ductuanbk.github.io` ở nhà cung cấp tên miền.

## Đưa bảng hàng lên website adongland.vn (WordPress, theme Flatsome)

Website chỉ có **một trang bảng hàng công khai cho khách**, chạy trực tiếp trên adongland.vn, **không phụ thuộc GitHub**. App quản lý nội bộ vẫn dùng riêng qua link Apps Script (cần đăng nhập Google).

**Cách dán (khoảng 3 phút)**

1. Mở file `wordpress/bang-hang-cong-khai.html`, chọn tất cả và sao chép (3 dòng, khoảng 27 KB; dòng thứ ba rất dài, đó là toàn bộ mã bảng hàng đã nén).
2. WordPress › Trang › Thêm mới (ví dụ "Bảng hàng", đường dẫn `bang-hang`) › mở bằng UX Builder.
3. Add Elements › Content › **HTML**, dán toàn bộ, bấm Apply rồi Update. Trình soạn khối WordPress: dùng khối **HTML tùy chỉnh**.
4. Mở trang ở chế độ xem (không phải trong UX Builder) để kiểm tra; trong khung soạn thảo, bảng có thể không chạy.

**Cách hoạt động**

- Toàn bộ mã bảng hàng nằm sẵn trong đoạn dán, chỉ lấy dữ liệu từ dự án Apps Script công khai (`script.google.com`) và font chữ từ Google Fonts.
- Bảng chạy trong Shadow DOM nên CSS Flatsome không làm vỡ bảng và ngược lại. Tự co theo bề rộng cột nội dung, trên điện thoại chuyển sang dạng thẻ.
- Bấm một căn để xem chi tiết, có nút gọi hotline và hỏi qua Zalo.
- Thêm `data-du-an="VHSGP"` (hoặc `VHCG`) vào thẻ `<div data-adl-bang-hang>` để chỉ hiện một dự án.
- Cần quyền Quản trị viên (Administrator) để lưu đoạn mã có `<script>`; tài khoản Biên tập viên sẽ bị WordPress xóa phần mã.

**Lưu ý cache và tối ưu JS**

- Nếu dùng WP Rocket, LiteSpeed Cache hoặc Autoptimize: loại trừ `adl-bang-hang` (từ khóa có trong đoạn mã) và `script.google.com` khỏi "Delay JavaScript execution", "Combine/Minify inline JS". Không loại trừ thì bảng chỉ hiện khi khách cuộn hoặc chạm.
- Không cần xóa cache trang khi bảng hàng đổi: dữ liệu tải trong trình duyệt, trễ tối đa khoảng 2 phút.

**Tab ĐQ:** phía trên bảng có hai tab "Tất cả căn" và "ĐQ Á Đông Land" (căn thuộc tab giỏ có `kind: 'exclusive'`, ví dụ `GHĐQ ADL`, `GHĐQ`), kèm số căn. Căn ĐQ có nhãn "ĐQ" cạnh mã căn. Đổi tên hoặc tắt tab trong `publicSite.exclusiveTab` (`Config.gs`). Mở sẵn tab ĐQ: thêm `data-gio="dq"` vào thẻ div, hoặc dùng link có `#gio=dq`.

**Khung chi tiết căn:** bấm vào một căn để xem các mục Giá (kèm nút **Phiếu tính giá** mở link PTG của đúng căn đó), Diện tích (kèm nút **Chỉ căn** nếu sheet có link), Thông tin căn, Trạng thái và liên hệ. Có nút chuyển sang căn trước/sau (hoặc phím mũi tên trái/phải). Link lấy từ cột `Link PTG` / `PTG + Chỉ căn` trong sheet; bật tắt bằng `publicSite.showLinks` trong `Config.gs`.

**Vì sao mã trong đoạn dán được mã hóa:** WordPress/Flatsome đổi ký tự `&` thành `&#038;` ngay cả bên trong thẻ `<script>`, làm mã hỏng và bảng không hiện (lỗi gặp thật trên adongland.vn ngày 07/11/2026). Mã bảng hàng vì vậy được mã hóa base64 và tự giải mã khi chạy; đoạn dán không chứa ký tự nào WordPress có thể đổi.

**Sửa giao diện bảng hàng về sau:** sửa `docs/embed.js`, chạy `npm i terser` một lần rồi `node tools/build-wordpress.mjs` để tạo lại `wordpress/bang-hang-cong-khai.html`, sau đó dán lại vào WordPress.

### Các tab thông tin dự án

Phía trên bảng hàng có thanh tab: Tổng quan, Vị trí, Phân khu, Mặt bằng Layout, **Quỹ căn** (bảng hàng, mở mặc định), Chính sách bán hàng, Tiến độ, Tài liệu, Tin tức.

- **Nội dung lấy trực tiếp từ trang dự án trên WordPress** (`projectLinks`, ví dụ https://adongland.vn/vinhomes-saigon-park/). Mỗi tiêu đề H2 của trang được xếp vào tab có từ khóa khớp: "Vị trí…" vào tab Vị trí, "Phân khu…" vào Phân khu, "Mặt bằng…" vào Mặt bằng Layout, "Giá bán / Chính sách…" vào Chính sách bán hàng, "Tiến độ…" vào Tiến độ, "Pháp lý…" vào Tài liệu, còn lại vào Tổng quan. Mục hỏi đáp và khung "Nhận bảng giá / tài liệu" được bỏ qua.
- **Sửa nội dung**: sửa trang dự án trong WordPress (thêm, bớt, đổi tiêu đề H2). Tab cập nhật sau tối đa 30 phút với khách đã xem trước đó, ngay lập tức với khách mới. Muốn một mục vào đúng tab, đặt tiêu đề H2 chứa từ khóa của tab đó.
- **Mặt bằng Layout**: thư viện file mặt bằng và layout thiết kế, chia nhóm Mặt bằng tổng thể / Phân khu, tiện ích / Sản phẩm, thiết kế / Tài liệu mặt bằng; mỗi thẻ có nút Phóng to và Ảnh gốc. Tự gom ảnh trong mục Mặt bằng, Phân khu của trang dự án và ảnh có chú thích (alt) chứa "mặt bằng", "layout", "thiết kế", "sơ đồ", "kiến trúc". Thêm ảnh: chèn vào trang dự án với chú thích như trên; thêm file PDF/Drive: khai báo ở `layouts` trong `docs/embed.js`.
- **Tài liệu**: tự liệt kê link PDF, Google Drive, Google Docs có trong trang dự án; thêm tài liệu riêng ở `docs` trong cấu hình `embed.js`.
- **Tin tức**: tự lấy bài viết trên website theo cụm từ trong `newsSearch` (bài có tên dự án trong tiêu đề xếp trước).
- Đổi tên, thứ tự hoặc bỏ tab: sửa danh sách `tabs` trong `docs/embed.js` rồi tạo lại đoạn mã WordPress (`node tools/build-wordpress.mjs`).

### Giá TTS, Giá TTTĐ, Quỹ căn

- Thêm cột tiêu đề bắt đầu bằng **"Giá TTS"** hoặc **"Giá TTTĐ"** vào tab giỏ hàng là bảng hàng tự hiện các giá này, không cần sửa mã.
- **Quỹ căn Sơ cấp / Thứ cấp**: nếu tab có cột "Quỹ căn" thì lấy theo cột đó; nếu không, STK hoặc ghi chú chứa từ trong `publicSite.primaryKeywords` (CĐT, chủ đầu tư, sơ cấp, Berjaya) là Sơ cấp, còn lại là Thứ cấp. Thêm tên quỹ chủ đầu tư vào danh sách này trong `Config.gs` khi cần.

### Đo lường (Google Tag Manager / GA4)

Bảng hàng đẩy sự kiện `adl_bang_hang` vào `dataLayer` nếu website có cài Google Tag Manager. Biến `adl_action` cho biết khách làm gì: `xem_can`, `goi`, `zalo`, `phieu_tinh_gia`, `chi_can`, `thong_tin_du_an`, `chia_se`, `gui_thong_tin`; kèm `adl_project`, `adl_unit` (mã căn), `adl_price`. Trong GTM: tạo trigger Custom Event tên `adl_bang_hang`, tạo các biến Data Layer tương ứng, rồi gửi sự kiện GA4. Website chưa cài GTM thì bảng hàng vẫn chạy bình thường.

## Bản đang chạy

- Dự án Apps Script: **Giỏ hàng Á Đông Land**, tạo ngày 04/11/2026 trên tài khoản `tranductuan06@gmail.com`. Mở để sửa tại `https://script.google.com/d/1dQF-b0wb7FiatIk102i5If10gvQzCI4WYGik-AG23-wN_89Q0IamweX6/edit`.
- Lần triển khai nội bộ hiện tại: @6 "Giá TTS, TTTĐ, Quỹ căn, hotline mới" (cùng link với @1). Web app chạy dưới tài khoản trên, người dùng cần đăng nhập Google để mở.
- Dự án công khai: **Bảng hàng công khai Á Đông Land**, script ID `112W2VPk53f-7NyYsZva1mFYMXcEnNESx7s-nMiRcp8NBqpP1bGMhCj2K`, triển khai @6 truy cập ẩn danh. Link `/exec` của dự án này nằm trong `docs/config.js` (chỉ trả dữ liệu đã lọc nên để công khai được).
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
