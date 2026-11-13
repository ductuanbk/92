/*!
 * Bảng hàng Á Đông Land: khối nhúng cho website (WordPress/Flatsome hoặc trang bất kỳ).
 *
 * Cách dùng trên WordPress: dán file wordpress/bang-hang-cong-khai.html (đã gồm sẵn mã này,
 * mã hóa một dòng) vào phần tử HTML của Flatsome hoặc khối HTML tùy chỉnh. Không cần tải file ngoài.
 * Tạo lại file đó sau khi sửa mã này: node tools/build-wordpress.mjs
 *
 * Tùy chọn (thuộc tính trên thẻ div):
 *   data-du-an="VHSGP"   chỉ hiện một dự án (VHSGP hoặc VHCG), ẩn nút chuyển dự án
 *   data-tieu-de="0"     ẩn khung tiêu đề dự án phía trên bảng
 *   data-lien-ket="0"    không ghi mã căn lên thanh địa chỉ
 *   data-gio="dq"        mở sẵn tab ĐQ (giỏ hàng độc quyền Á Đông Land)
 *   data-muc="tong-quan" mở sẵn tab thông tin khác (mặc định: quy-can). Các tab: tong-quan, vi-tri, phan-khu,
 *                        mat-bang, quy-can, chinh-sach, tien-do, tai-lieu, tin-tuc
 *
 * Khối chạy trong Shadow DOM: CSS của theme không ảnh hưởng tới bảng và ngược lại.
 * Dữ liệu chỉ gồm trường công khai (xem Code.gs › publicData_).
 */
(function () {
  'use strict';
  if (window.__adlBangHangLoaded) return;
  window.__adlBangHangLoaded = true;

  var DEFAULTS = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwwmEKbhm_tU2C0MtddBsS-3N2tqy5aAvzKPva8_XZUc_EPODnpUXyPnhk8Ia--4B59/exec',
    brandName: 'Á Đông Land',        // tên hiển thị trên bảng hàng (đổi khi dùng cho đơn vị khác)
    brandColor: '',                   // màu nhấn, ví dụ '#a31d24'; để trống dùng màu mặc định
    hotline: '0901303092',
    hotlineText: '0901 30 30 92',
    zalo: 'https://zalo.me/386470265573132310',
    projectOrder: ['VHSGP', 'VHCG'],
    // Trang thông tin từng dự án trên adongland.vn (nút "Thông tin dự án")
    projectLinks: {
      VHSGP: 'https://adongland.vn/vinhomes-saigon-park/',
      VHCG: 'https://adongland.vn/vinhomes-green-paradise/'
    },
    refreshSeconds: 120,
    pageSize: 50,
    // Trang WordPress riêng chứa nội dung các tab (không vào menu, không cho Google lập chỉ mục).
    // Chưa tạo trang này thì các tab lấy nội dung từ trang dự án (projectLinks).
    contentPages: {
      VHSGP: 'https://adongland.vn/noi-dung-tab-vinhomes-saigon-park/',
      VHCG: 'https://adongland.vn/noi-dung-tab-vinhomes-green-paradise/'
    },
    // Các tab thông tin dự án. Nội dung lấy từ trang nội dung riêng (contentPages) hoặc trang dự án (projectLinks):
    // mỗi tiêu đề H2 của trang được xếp vào tab có từ khóa khớp (không dấu, chữ thường).
    // Sửa trang dự án trong WordPress là các tab tự cập nhật. Đổi tên, thứ tự, bỏ tab: sửa danh sách này.
    tabs: [
      { id: 'tong-quan', label: 'Tổng quan', icon: 'globe', match: ['tong quan', 'chu dau tu', 'tien ich', 'ly do', 'co nen', 'so sanh', 'gioi thieu'] },
      { id: 'vi-tri', label: 'Vị trí', icon: 'pin', match: ['vi tri', 'ket noi'] },
      { id: 'phan-khu', label: 'Phân khu', icon: 'grid', match: ['phan khu'] },
      { id: 'mat-bang', label: 'Mặt bằng Layout', icon: 'map', match: ['mat bang', 'layout'] },
      { id: 'quy-can', label: 'Quỹ căn', icon: 'house' },
      { id: 'chinh-sach', label: 'Chính sách bán hàng', icon: 'doc', match: ['gia ban', 'chinh sach', 'bang gia', 'uu dai', 'thanh toan'] },
      { id: 'tien-do', label: 'Tiến độ', icon: 'cal', match: ['tien do'] },
      { id: 'tai-lieu', label: 'Tài liệu', icon: 'book', match: ['phap ly', 'tai lieu'] },
      { id: 'tin-tuc', label: 'Tin tức', icon: 'news' }
    ],
    defaultTab: 'quy-can',
    // Lựa chọn ghép thêm vào ô Bàn giao: bàn giao + nhãn, ví dụ "Thô VOS" = bàn giao Thô và thuộc Quỹ VOS.
    handoverCombos: [{ label: 'Thô VOS', handover: 'Thô', tag: 'VOS' }],
    // Tiêu đề chứa các cụm này không đưa vào tab (hỏi đáp, khung mời để lại thông tin...).
    skipHeadings: ['cau hoi', 'hoi dap', 'nhan tai lieu', 'nhan bang gia', 'nhan tron bo', 'nhan thong tin', 'nhan phuong an', 'dang ky'],
    // Thứ tự xét từ khóa khi một tiêu đề khớp nhiều tab.
    tabPriority: ['tien-do', 'mat-bang', 'phan-khu', 'chinh-sach', 'tai-lieu', 'vi-tri', 'tong-quan'],
    // Tin tức: tìm bài trên website theo các cụm này (bài có cụm trong tiêu đề xếp trước).
    newsSearch: { VHSGP: ['Vinhomes Saigon Park', 'Vinhomes Hóc Môn'], VHCG: ['Vinhomes Green Paradise', 'Vinhomes Cần Giờ'] },
    // Tài liệu tải về thêm tay cho từng dự án: [{ label: 'Tên tài liệu', url: 'https://...' }]
    docs: { VHSGP: [], VHCG: [] },
    // Tab Mặt bằng Layout: tự gom ảnh trong mục Mặt bằng, Phân khu của trang dự án và ảnh có chú thích (alt) chứa các cụm này.
    layoutWords: ['mat bang', 'layout', 'so do', 'thiet ke', 'kien truc', 'mau nha', 'tmb', 'quy hoach'],
    // File mặt bằng thêm tay (ảnh, PDF, Google Drive): [{ title: 'Mặt bằng phân khu A', url: 'https://...', group: 'Phân khu, tiện ích' }]
    layouts: { VHSGP: [], VHCG: [] }
  };
  var C = Object.assign({}, DEFAULTS, window.ADL_SITE || {});

  // Font dùng chung (nạp một lần vào trang cha; Shadow DOM dùng được font đã nạp).
  if (!document.querySelector('link[data-adl-font]')) {
    var lf = document.createElement('link');
    lf.rel = 'stylesheet'; lf.setAttribute('data-adl-font', '');
    lf.href = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&display=swap';
    document.head.appendChild(lf);
  }

  var CSS = `
:host { all: initial; display: block; }
.w {
  --brand: #a31d24; --brand-soft: #fdeeee; --navy: #0b1f4b; --navy-2: #163a7a; --ink: #1f2a3d; --ink-2: #4a5468; --muted: #8a94a6;
  --line: #e9edf3; --line-2: #f1f4f8; --bg: #f6f8fb; --gold: #f0b429;
  --ok: #137a48; --ok-bg: #e7f6ee; --hold: #9a5b00; --hold-bg: #fff3dc; --other: #3d4a63; --other-bg: #eef1f6; --sold: #8a94a6; --sold-bg: #f1f3f6;
  container-type: inline-size; max-width: 1240px; margin: 0 auto; padding: 8px 20px 40px;
  color: var(--ink); font: 400 14px/1.5 "Be Vietnam Pro", -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  text-align: left; letter-spacing: normal; word-spacing: normal; text-transform: none; text-indent: 0; white-space: normal; font-style: normal;
}
.w *, .w *::before, .w *::after { box-sizing: border-box; }
button, input, select { font: inherit; color: inherit; margin: 0; letter-spacing: normal; text-transform: none; min-height: 0; box-shadow: none; }
button { cursor: pointer; }
a { color: var(--brand); }
[hidden] { display: none !important; }

/* Khung tiêu đề dự án */
.hero { position: relative; overflow: hidden; background: linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%); color: #fff; border-radius: 16px; padding: 26px 28px 22px; margin-bottom: 16px; }
.hero::after { content: ""; position: absolute; right: -80px; top: -80px; width: 280px; height: 280px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.10), rgba(255,255,255,0) 70%); }
.hero-top { display: flex; gap: 16px; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; position: relative; z-index: 1; }
.eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase; color: var(--gold); margin: 0 0 6px; }
.hero h2 { margin: 0; font-size: 30px; line-height: 1.2; font-weight: 700; color: #fff; letter-spacing: -.3px; }
.hero p { margin: 8px 0 0; color: rgba(255,255,255,.78); font-size: 13.5px; }
.switch { display: inline-flex; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 4px; gap: 2px; flex-wrap: wrap; }
.switch button { border: 0; background: transparent; color: rgba(255,255,255,.85); padding: 7px 16px; border-radius: 999px; font-weight: 600; font-size: 13px; white-space: nowrap; }
.switch button.on { background: #fff; color: var(--navy); }

/* Tab giỏ hàng (Tất cả / ĐQ) */
.gtabs { display: flex; gap: 4px; margin: 0 0 12px; border-bottom: 1px solid var(--line); }
.gtabs button { white-space: nowrap; border: 0; background: none; padding: 10px 16px 11px; font-size: 15px; font-weight: 600; color: var(--ink-2); border-bottom: 3px solid transparent; margin-bottom: -1px; display: inline-flex; align-items: center; gap: 8px; }
.gtabs button b { font-weight: 700; font-size: 12px; background: var(--other-bg); color: var(--other); border-radius: 999px; padding: 1px 8px; }
.gtabs button.on { color: var(--navy); border-bottom-color: var(--brand); }
.gtabs button.on b { background: var(--brand); color: #fff; }
.gtabs .dqmark { background: linear-gradient(135deg, #f0b429, #d98c00); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: .5px; padding: 2px 7px; border-radius: 5px; }
.dq { display: inline-block; vertical-align: 1px; margin-left: 6px; background: linear-gradient(135deg, #f0b429, #d98c00); color: #fff; font-size: 10.5px; font-weight: 700; letter-spacing: .5px; padding: 2px 6px; border-radius: 4px; }
.dq.tg { background: linear-gradient(135deg, #1aa3a3, #0d7377); margin-left: 4px; }
.dq + .dq { margin-left: 4px; }

.plink { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 7px 14px; border-radius: 999px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); color: #fff; font-weight: 600; font-size: 13px; text-decoration: none; }
.plink:hover { background: #fff; color: var(--navy); }
.plink span { font-size: 12px; opacity: .85; }

/* Thanh tìm kiếm và lọc */
.tools { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(16,24,40,.04); }
.row1 { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search { flex: 1 1 260px; min-width: 0; height: 42px; padding: 0 14px; border: 1px solid #dfe4ec; border-radius: 10px; background: var(--bg); font-size: 14px; }
.search:focus, .sort select:focus, .adv select:focus, .adv input:focus { outline: 2px solid rgba(22,58,122,.25); border-color: var(--navy-2); background: #fff; }
.sort { display: inline-flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
.sort select { height: 42px; padding: 0 12px; border: 1px solid #dfe4ec; border-radius: 10px; background: #fff; min-width: 190px; }
.adv-btn { height: 42px; padding: 0 16px; border-radius: 10px; border: 1px solid #dfe4ec; background: #fff; font-weight: 600; color: var(--navy); display: inline-flex; align-items: center; gap: 8px; }
.adv-btn.on { background: var(--navy); border-color: var(--navy); color: #fff; }
.badge { display: inline-block; min-width: 18px; padding: 0 6px; border-radius: 999px; background: var(--brand); color: #fff; font-size: 11px; line-height: 18px; text-align: center; }
.adv { display: grid; grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); gap: 12px 14px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line-2); }
.fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.fld > span { font-size: 12px; font-weight: 600; color: var(--ink-2); }
.fld select { appearance: none; -webkit-appearance: none; width: 100%; min-width: 0; height: 42px; padding: 0 36px 0 12px; border: 1px solid #dfe4ec; border-radius: 10px;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%238a94a6' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 13px center;
  font-size: 14px; color: var(--ink); cursor: pointer; text-overflow: ellipsis; }
.fld select:hover { border-color: #c3cbd8; }
.fld select:focus { outline: 2px solid rgba(22,58,122,.2); border-color: var(--navy-2); }
.fld.set select { border-color: var(--navy-2); background-color: #f2f6fd; color: var(--navy); font-weight: 600; }
.adv-foot { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 2px; color: var(--muted); font-size: 13px; }

/* Dòng kết quả */
.resbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 4px 2px 10px; color: var(--ink-2); font-size: 13.5px; }
.resbar b { color: var(--navy); }
.link { background: none; border: 0; padding: 0; color: var(--brand); font-weight: 600; font-size: 13px; text-decoration: underline; text-underline-offset: 2px; }
.spacer { flex: 1; }

/* Bảng */
.tw { background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: auto; max-height: 78vh; box-shadow: 0 1px 3px rgba(16,24,40,.04); }
table { border-collapse: separate; border-spacing: 0; width: 100%; margin: 0; border: 0; }
th, td { text-align: left; white-space: nowrap; padding: 12px 14px; border: 0; border-bottom: 1px solid var(--line-2); font-size: 14px; vertical-align: middle; background: transparent; }
th { position: sticky; top: 0; z-index: 1; background: #f8fafc; color: #7b8598; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; user-select: none; border-bottom: 1px solid var(--line); cursor: pointer; }
th:hover { color: var(--navy); }
th .si { display: inline-block; width: 10px; margin-left: 4px; color: var(--brand); }
th.num, td.num { text-align: right; }
tbody tr { cursor: pointer; transition: background .12s; }
tbody tr:nth-child(even) td { background: #fcfdfe; }
tbody tr:hover td { background: #f3f7fd; }
tbody tr:last-child td { border-bottom: 0; }
.code { display: inline-block; background: var(--brand-soft); color: var(--brand); font-weight: 700; padding: 3px 9px; border-radius: 6px; letter-spacing: .2px; font-size: 13.5px; }
.price { font-weight: 700; color: var(--navy); font-size: 15px; }
.unitp { display: block; color: var(--muted); font-size: 12px; margin-top: 1px; }
.m2 { color: var(--muted); font-size: 12px; margin-left: 2px; }
.dim { color: #b6bdc9; }
.stt { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 12.5px; font-weight: 600; white-space: nowrap; background: var(--cb); color: var(--c); }
.stt::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--c); }
.s-ok { --c: var(--ok); --cb: var(--ok-bg); } .s-hold { --c: var(--hold); --cb: var(--hold-bg); }
.s-other { --c: var(--other); --cb: var(--other-bg); } .s-sold { --c: var(--sold); --cb: var(--sold-bg); }
.go { color: #c3cad6; font-size: 18px; text-align: right; width: 24px; }
tbody tr:hover .go { color: var(--brand); }
.more { display: flex; justify-content: center; margin: 14px 0 4px; }
.more button { border: 1px solid #dfe4ec; background: #fff; color: var(--navy); font-weight: 600; border-radius: 10px; padding: 10px 22px; }
.more button:hover { border-color: var(--navy); }
.empty { padding: 44px 20px; text-align: center; color: var(--muted); white-space: normal; }
.ptabs { display: flex; justify-content: center; gap: 0; margin: 0 0 16px; border-bottom: 1px solid var(--line); overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.ptabs::-webkit-scrollbar { display: none; }
.ptabs button { flex: none; display: inline-flex; align-items: center; gap: 7px; border: 0; background: none; padding: 12px 14px 13px; font-size: 14.5px; font-weight: 600; color: var(--ink-2); border-bottom: 3px solid transparent; margin-bottom: -1px; white-space: nowrap; position: relative; }
.ptabs button + button::before { content: ""; position: absolute; left: 0; top: 50%; height: 16px; margin-top: -8px; border-left: 1px solid #d5dbe5; }
.ptabs button svg { width: 17px; height: 17px; color: var(--navy-2); }
.ptabs button:hover { color: var(--navy); }
.ptabs button.on { color: #d98c00; border-bottom-color: var(--gold); }
.ptabs button.on svg { color: var(--brand); }
.info { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 28px; align-items: start; }
.info.solo { grid-template-columns: minmax(0, 1fr); }
.toc { position: sticky; top: 16px; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 10px; }
.toc b { display: block; font-size: 12px; letter-spacing: .6px; text-transform: uppercase; color: var(--muted); padding: 0 8px 8px; }
.toc a { display: block; padding: 7px 8px; border-radius: 8px; color: var(--ink); font-size: 13.5px; line-height: 1.4; text-decoration: none; }
.toc a.sub { padding-left: 20px; color: var(--ink-2); font-size: 13px; }
.toc a:hover { background: var(--bg); color: var(--navy); }
.doc { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 26px 30px; min-width: 0; }
.doc .sec + .sec { margin-top: 30px; padding-top: 26px; border-top: 1px solid var(--line-2); }
.doc h2 { margin: 0 0 14px; font-size: 23px; line-height: 1.3; color: var(--navy); font-weight: 700; padding-left: 14px; border-left: 4px solid var(--brand); }
.doc h3 { margin: 22px 0 10px; font-size: 18px; line-height: 1.35; color: var(--navy); font-weight: 700; }
.doc h4 { margin: 16px 0 8px; font-size: 16px; color: var(--ink); font-weight: 700; }
.doc p { margin: 0 0 12px; font-size: 15px; line-height: 1.75; color: var(--ink-2); }
.doc p.cap { font-size: 13px; color: var(--muted); text-align: center; margin-top: -4px; }
.doc a { color: var(--navy-2); font-weight: 600; }
.doc ul, .doc ol { margin: 0 0 14px; padding: 0; list-style: none; display: grid; gap: 8px; }
.doc li { position: relative; padding-left: 22px; font-size: 15px; line-height: 1.65; color: var(--ink-2); }
.doc ul li::before { content: ""; position: absolute; left: 4px; top: 9px; width: 7px; height: 7px; border-radius: 50%; background: var(--gold); }
.doc ol { counter-reset: n; } .doc ol li { counter-increment: n; padding-left: 30px; }
.doc ol li::before { content: counter(n); position: absolute; left: 0; top: 2px; width: 21px; height: 21px; border-radius: 50%; background: var(--navy); color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.doc .pic { margin: 6px 0 16px; border-radius: 12px; overflow: hidden; background: var(--bg); border: 1px solid var(--line); cursor: zoom-in; }
.doc .pic img { display: block; width: 100%; height: auto; }
.doc .gal { display: grid; grid-template-columns: repeat(var(--g, 2), minmax(0, 1fr)); gap: 10px; margin: 6px 0 16px; }
.doc .gal .pic { margin: 0; aspect-ratio: 4 / 3; }
.doc .gal .pic img { height: 100%; object-fit: cover; }
.doc .tbl { overflow-x: auto; margin: 4px 0 16px; border: 1px solid var(--line); border-radius: 12px; }
.doc table { width: 100%; border-collapse: collapse; font-size: 14px; }
.doc th, .doc td { padding: 10px 12px; border-bottom: 1px solid var(--line-2); text-align: left; white-space: normal; vertical-align: top; color: var(--ink-2); }
.doc tr:first-child td, .doc th { background: #f8fafc; color: var(--navy); font-weight: 700; }
.doc tr:last-child td { border-bottom: 0; }
.doc .vid { position: relative; aspect-ratio: 16 / 9; margin: 6px 0 16px; border-radius: 12px; overflow: hidden; background: #000; }
.doc .vid iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.doc blockquote { margin: 0 0 14px; padding: 12px 16px; border-left: 4px solid var(--gold); background: #fffaf0; border-radius: 0 10px 10px 0; color: var(--ink); font-size: 15px; line-height: 1.7; }
.cta { margin-top: 26px; display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; background: linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%); color: #fff; border-radius: 14px; padding: 18px 20px; }
.cta b { display: block; font-size: 16px; } .cta span { font-size: 13px; color: rgba(255,255,255,.75); }
.cta .btns { display: flex; gap: 8px; flex-wrap: wrap; }
.cta a { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 16px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; background: #fff; color: var(--navy); }
.cta a.call { background: var(--brand); color: #fff; } .cta a svg { width: 16px; height: 16px; }
.src { margin: 12px 2px 0; font-size: 12px; color: var(--muted); }
.src a { color: var(--navy-2); }
.lchips { display: flex; gap: 8px; flex-wrap: wrap; margin: 4px 0 16px; }
.lchips button { border: 1px solid #dfe4ec; background: #fff; color: var(--ink-2); border-radius: 999px; padding: 7px 14px; font-size: 13.5px; font-weight: 600; display: inline-flex; gap: 6px; align-items: center; }
.lchips button b { font-size: 12px; color: var(--muted); }
.lchips button.on { background: var(--navy); border-color: var(--navy); color: #fff; } .lchips button.on b { color: rgba(255,255,255,.7); }
.lgrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 8px; }
.lcard { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: #fff; display: flex; flex-direction: column; transition: box-shadow .15s; }
.lcard:hover { box-shadow: 0 10px 24px rgba(16,24,40,.08); }
.lcard[hidden] { display: none; }
.doc .lthumb { margin: 0; border: 0; border-radius: 0; aspect-ratio: 4 / 3; background: #eef2f7; display: flex; align-items: center; justify-content: center; }
.doc .lthumb img { width: 100%; height: 100%; object-fit: contain; }
.doc .lthumb.file { flex-direction: column; gap: 8px; color: var(--brand); text-decoration: none; font-weight: 600; font-size: 14px; }
.lthumb.file svg { width: 44px; height: 44px; }
.lmeta { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 4px; flex: 1; border-top: 1px solid var(--line-2); }
.lmeta i { font-style: normal; font-size: 11.5px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: #d98c00; }
.lmeta b { font-size: 14.5px; line-height: 1.45; color: var(--navy); }
.lact { display: flex; gap: 8px; margin-top: auto; padding-top: 8px; }
.lact button, .doc .lact a { flex: 1; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 9px; font-size: 13px; font-weight: 700; text-decoration: none; border: 1px solid #dfe4ec; background: #f8fafc; color: var(--navy); }
.lact button:hover, .doc .lact a:hover { border-color: var(--navy-2); background: #fff; }
.docs { display: grid; gap: 8px; margin: 4px 0 16px; }
.docs a { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; text-decoration: none; color: var(--ink); font-weight: 600; background: #f8fafc; }
.docs a:hover { border-color: var(--navy-2); background: #fff; }
.docs a svg { width: 20px; height: 20px; color: var(--brand); flex: none; } .docs a span { flex: 1; } .docs a i { font-style: normal; color: var(--muted); }
.news { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.post { display: flex; flex-direction: column; background: #fff; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; text-decoration: none; color: var(--ink); transition: box-shadow .15s, transform .15s; }
.post:hover { box-shadow: 0 10px 24px rgba(16,24,40,.10); transform: translateY(-2px); }
.post .im { aspect-ratio: 16 / 10; background: var(--bg) center / cover no-repeat; }
.post .tx { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 6px; }
.post time { font-size: 12px; color: var(--muted); }
.post b { font-size: 15.5px; line-height: 1.45; color: var(--navy); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.post p { margin: 0; font-size: 13.5px; line-height: 1.6; color: var(--ink-2); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.iload { padding: 40px 20px; text-align: center; color: var(--muted); background: #fff; border: 1px solid var(--line); border-radius: 16px; }
@container (max-width: 980px) { .news, .lgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .info { grid-template-columns: minmax(0, 1fr); } .toc { display: none; } }
.legal { color: var(--muted); font-size: 12px; margin: 12px 2px 0; line-height: 1.6; }
.skel td span { display: block; height: 12px; border-radius: 6px; background: linear-gradient(90deg, #eef1f5 25%, #f6f8fb 50%, #eef1f5 75%); background-size: 200% 100%; animation: sh 1.2s infinite; }
@keyframes sh { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* Thẻ căn trên điện thoại */
.cards { display: none; }
.card { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(16,24,40,.04); cursor: pointer; }
.card .r1 { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.card .r2 { display: flex; align-items: baseline; gap: 8px; margin: 10px 0 10px; flex-wrap: wrap; }
.card .r2 .price { font-size: 19px; }
.card .r2 .unitp { display: inline; }
.facts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; padding-top: 10px; border-top: 1px solid var(--line-2); }
.facts div { font-size: 13px; color: var(--ink); }
.facts span { display: block; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .3px; }

/* Chi tiết căn: hai cột (ảnh bên trái, thông tin bên phải) */
.mbg { position: fixed; inset: 0; background: rgba(11,31,75,.5); display: none; align-items: center; justify-content: center; z-index: 2147483000; padding: 16px; }
.mbg.open { display: flex; }
.modal { background: #fff; border-radius: 18px; width: min(1180px, 100%); max-height: 94vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,.28); overflow: hidden; }
.mh { display: flex; align-items: center; gap: 12px; padding: 14px 18px 14px 22px; border-bottom: 1px solid var(--line); }
.mh h3 { margin: 0; font-size: 26px; font-weight: 700; color: var(--navy); line-height: 1.15; letter-spacing: .3px; }
.mh .sub { color: var(--muted); font-size: 13px; margin-top: 3px; }
.mh .np { margin-left: auto; text-align: right; }
.mh .np .row { display: flex; align-items: baseline; gap: 8px; justify-content: flex-end; }
.mh .np .k { color: var(--muted); font-size: 13px; }
.mh .np .v { color: #e3262d; font-size: 28px; font-weight: 700; line-height: 1.1; }
.mh .np .k2 { color: var(--muted); font-size: 12px; }
.close { background: transparent; border: 0; width: 38px; height: 38px; border-radius: 50%; color: var(--ink-2); font-size: 22px; line-height: 38px; padding: 0; flex: none; }
.close:hover { background: var(--bg); }
.close:disabled { opacity: .3; cursor: default; }
.mb { display: grid; grid-template-columns: minmax(0, 46fr) minmax(0, 54fr); overflow: auto; }
.mleft { background: #f6f8fb; border-right: 1px solid var(--line); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.media { position: relative; border-radius: 14px; overflow: hidden; background: #eef2f7; border: 1px solid var(--line); aspect-ratio: 4 / 5; max-height: 64vh; display: flex; align-items: center; justify-content: center; }
.media.has-img { cursor: zoom-in; }
.media.no-img { aspect-ratio: 4 / 3; }
.media img { width: 100%; height: 100%; object-fit: contain; display: block; opacity: 0; transition: opacity .25s; }
.media img.ok { opacity: 1; }
.media.loading::before { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, #eef2f7 30%, #f8fafc 50%, #eef2f7 70%); background-size: 200% 100%; animation: sh 1.2s infinite; }
.media .mtools { position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; z-index: 1; }
.media .mtools a, .media .mtools button { background: rgba(255,255,255,.95); color: var(--navy); border: 0; border-radius: 999px; padding: 7px 12px; font-size: 12.5px; font-weight: 600; text-decoration: none; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
.media .hint { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); background: rgba(11,31,75,.72); color: #fff; font-size: 12px; padding: 5px 12px; border-radius: 999px; white-space: nowrap; pointer-events: none; }
.media .poster { border-radius: 0; }
.zoom { position: fixed; inset: 0; z-index: 2147483002; background: #050c1e; display: none; overflow: auto; -webkit-overflow-scrolling: touch; }
.zoom.open { display: flex; flex-direction: column; justify-content: center; }
.zoom img { display: block; width: 100%; max-width: 1100px; height: auto; margin: auto; padding: 58px 0 20px; touch-action: pinch-zoom; }
.zoom .zbar { position: fixed; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 12px; background: linear-gradient(rgba(5,12,30,.9), rgba(5,12,30,0)); color: #fff; font-weight: 600; }
.zoom .zbar a, .zoom .zbar button { color: #fff; background: rgba(255,255,255,.14); border: 0; border-radius: 999px; padding: 8px 14px; font-size: 13px; font-weight: 600; text-decoration: none; }
.poster { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 22px; color: #fff;
  background: radial-gradient(120% 80% at 100% 0%, rgba(240,180,41,.18), rgba(240,180,41,0) 55%), linear-gradient(160deg, #0b1f4b 0%, #123a6b 55%, #0f5b63 100%); }
.poster .brand { display: flex; justify-content: space-between; align-items: center; font-size: 12px; letter-spacing: 1.4px; text-transform: uppercase; color: rgba(255,255,255,.75); }
.poster .brand b { color: var(--gold); letter-spacing: 1.6px; }
.poster .mc { font-size: 13px; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(255,255,255,.7); }
.poster .code2 { font-size: 46px; font-weight: 700; color: var(--gold); line-height: 1.05; letter-spacing: .5px; }
.poster .pfacts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.poster .pfacts div { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); border-radius: 10px; padding: 10px; }
.poster .pfacts span { display: block; font-size: 11px; color: rgba(255,255,255,.65); text-transform: uppercase; letter-spacing: .4px; }
.poster .pfacts b { font-size: 15px; font-weight: 600; }
.poster .pnote { font-size: 12.5px; color: rgba(255,255,255,.7); }
.poster .pnote a { color: #fff; font-weight: 600; }
.quick { display: grid; grid-template-columns: repeat(3, 1fr); background: #fff; border: 1px solid var(--line); border-radius: 12px; }
.quick div { text-align: center; padding: 10px 6px; }
.quick div + div { border-left: 1px solid var(--line-2); }
.quick span { display: inline-flex; align-items: center; gap: 5px; color: #2f6fd6; font-size: 13.5px; }
.quick svg { width: 15px; height: 15px; }
.quick b { display: block; margin-top: 2px; font-size: 13.5px; font-weight: 700; color: var(--ink); }
.acts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.act { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 44px; border-radius: 10px; border: 1px solid #dfe4ec; background: #fff; color: var(--ink); font-weight: 600; font-size: 14px; text-decoration: none; }
.act:hover { border-color: var(--navy-2); }
.act svg { width: 17px; height: 17px; }
.act.send { background: var(--navy); border-color: var(--navy); color: #fff; }
.act.send:hover { background: var(--navy-2); }
.mright { padding: 6px 22px 18px; }
.blk { padding: 14px 0; border-bottom: 1px solid var(--line-2); }
.blk:last-child { border-bottom: 0; }
.bh { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.bh h4 { margin: 0; font-size: 19px; font-weight: 700; color: var(--navy); }
.bh .tools2 { display: flex; gap: 6px; flex-wrap: wrap; }
.lk { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #e3e7ee; background: #f8fafc; border-radius: 8px; padding: 7px 12px; font-size: 13.5px; font-weight: 600; color: var(--navy); text-decoration: none; }
.lk:hover { border-color: var(--navy); background: #fff; }
.lk .ar { font-size: 12px; opacity: .6; padding-left: 6px; border-left: 1px solid #d5dbe5; }
.lk.on { background: var(--navy); border-color: var(--navy); color: #fff; }
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 28px; }
.g2 .r { display: flex; justify-content: space-between; gap: 10px; font-size: 14.5px; }
.g2 .r .k { color: var(--muted); }
.g2 .r .v { font-weight: 600; color: var(--ink); text-align: right; white-space: nowrap; }
.g2 .r .v.hl { color: #e3262d; font-weight: 700; }
.g2 .full { grid-column: 1 / -1; }
.tiles { display: grid; grid-template-columns: repeat(var(--n, 3), minmax(0, 1fr)); gap: 8px; }
.tile { background: #f8fafc; border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; min-width: 0; }
.tile span { display: block; font-size: 12px; color: var(--muted); }
.tile b { display: block; margin-top: 3px; font-size: 16px; font-weight: 700; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tile b small { font-size: 12px; font-weight: 600; color: var(--muted); }
.tile.hl { background: var(--brand-soft); border-color: #f5d3d5; } .tile.hl span { color: #b5474d; } .tile.hl b { color: #e3262d; }
.fund { display: inline-block; font-style: normal; font-size: 13px; padding: 1px 10px; border-radius: 999px; }
.fund.so { background: #e7f6ee; color: #11804a; } .fund.thu { background: #eaf1fd; color: #2f5fb8; }
.tnote { margin: 8px 0 0; font-size: 12px; color: var(--muted); }
.upd { margin: 0; font-size: 13.5px; color: var(--ink-2); } .upd b { color: var(--ink); }
.loan { margin-top: 12px; background: #f6f8fb; border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
.loan .in { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
.loan label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--ink-2); font-weight: 600; }
.loan select, .loan input { height: 38px; border: 1px solid #dfe4ec; border-radius: 8px; padding: 0 10px; background: #fff; font-size: 14px; width: 100%; min-width: 0; }
.loan .out { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.loan .out div { background: #fff; border-radius: 8px; padding: 8px 10px; }
.loan .out span { display: block; font-size: 11.5px; color: var(--muted); }
.loan .out b { font-size: 15px; color: var(--navy); }
.loan p { margin: 8px 0 0; font-size: 11.5px; color: var(--muted); }
.people { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; margin-top: 12px; }
.person { display: flex; gap: 12px; align-items: center; background: #f8fafc; border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
.ava { width: 52px; height: 52px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; background: linear-gradient(135deg, var(--navy), var(--navy-2)); border: 2px solid #fff; box-shadow: 0 0 0 1px var(--line); font-size: 16px; overflow: hidden; }
.ava img { width: 100%; height: 100%; object-fit: cover; }
.person .nm b { display: block; color: var(--ink); font-size: 15px; }
.person .nm span { display: block; color: var(--muted); font-size: 12.5px; }
.person .cbtn { display: flex; gap: 6px; margin-top: 6px; }
.cbtn a, .cbtn button { width: 46px; height: 32px; border-radius: 8px; border: 0; display: inline-flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; }
.cbtn .ph { background: #22b14c; } .cbtn .zl { background: #2f6fd6; }
.cbtn svg { width: 16px; height: 16px; }
.mfoot { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 6px; }
.mfoot .legal { flex: 1 1 100%; margin: 6px 0 0; }
.toast { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); background: #1f2a3d; color: #fff; padding: 10px 16px; border-radius: 10px; z-index: 2147483001; display: none; font-size: 13.5px; }
.toast.show { display: block; }

/* Co theo bề rộng khung chứa của theme */
@container (max-width: 1100px) { .col-build { display: none; } }
@container (max-width: 980px) { .adv { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@container (max-width: 980px) { .col-zone, .col-direction { display: none; } }
@container (max-width: 760px) {
  .w { padding: 4px 12px 32px; }
  .hero { padding: 20px 18px 18px; border-radius: 14px; }
  .hero h2 { font-size: 23px; }

  .hero-top { gap: 12px; }
  .gtabs button { flex: 1 1 0; justify-content: center; padding: 10px 4px 11px; font-size: 14px; gap: 6px; min-width: 0; }
  .switch { width: 100%; flex-wrap: nowrap; } .switch button { flex: 1 1 0; min-width: 0; padding: 8px 6px; font-size: 12.5px; white-space: normal; line-height: 1.25; }
  .search { flex: 1 1 100%; }
  .sort { flex: 1 1 0; min-width: 0; } .sort span { display: none; } .sort select { min-width: 0; width: 100%; }

  .adv { grid-template-columns: 1fr 1fr; gap: 10px; }
  .tw { display: none; } .cards { display: block; }
  .mbg { padding: 0; align-items: stretch; }
  .modal { border-radius: 0; max-height: 100vh; height: 100%; }
  .mh { flex-wrap: wrap; padding: 12px 14px; }
  .mh h3 { font-size: 22px; }
  .mh .np { order: 5; width: 100%; text-align: left; margin-left: 0; }
  .mh .np .row { justify-content: flex-start; } .mh .np .v { font-size: 24px; }
  #mPrev, #mNext { display: none; }
  .mh #mClose { margin-left: auto; }
  .mb { grid-template-columns: 1fr; }
  .mleft { border-right: 0; border-bottom: 1px solid var(--line); padding: 12px; }
  .media { aspect-ratio: auto; height: min(118vw, 68vh); max-height: none; border-radius: 12px; }
  .media.no-img { height: auto; aspect-ratio: 4 / 3; }
  .poster .code2 { font-size: 36px; } .poster { padding: 16px; }
  .quick b { font-size: 12.5px; } .quick span { font-size: 12.5px; }
  .mright { padding: 2px 14px 16px; }
  .g2 { grid-template-columns: 1fr; gap: 8px; }
  .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } .tiles .tile:last-child:nth-child(odd) { grid-column: 1 / -1; } .tile b { font-size: 15px; }
  .loan .in, .loan .out { grid-template-columns: 1fr 1fr; }
  .ptabs { justify-content: flex-start; margin: 0 -12px 14px; padding: 0 6px; }
  .ptabs button { padding: 11px 11px 12px; font-size: 14px; }
  .doc { padding: 18px 16px; border-radius: 14px; } .doc h2 { font-size: 20px; } .doc h3 { font-size: 17px; } .doc p, .doc li { font-size: 14.5px; }
  .doc .gal { grid-template-columns: 1fr 1fr; gap: 6px; }
  .news { grid-template-columns: 1fr; }
  .lgrid { grid-template-columns: 1fr; gap: 12px; }
  .lchips { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-right: -16px; padding-right: 16px; } .lchips button { flex: none; }
  .cta { padding: 16px; } .cta .btns { width: 100%; } .cta a { flex: 1; justify-content: center; }
}
`;

  var HTML = `
<div class="w">
  <section class="hero" id="hero">
    <div class="hero-top">
      <div><p class="eyebrow">Bảng hàng</p><h2 id="hName">Đang tải bảng hàng</h2><p id="hSub">Bảng giá tham khảo.</p><a class="plink" id="hLink" target="_blank" rel="noopener" hidden>Thông tin dự án <span>↗</span></a></div>
      <div class="switch" id="projects" role="tablist" aria-label="Chọn dự án"></div>
    </div>
  </section>

  <nav class="ptabs" id="ptabs" role="tablist" aria-label="Thông tin dự án"></nav>
  <div id="pInfo" hidden></div>
  <div id="pQuy">
  <div class="gtabs" id="gtabs" role="tablist" aria-label="Chọn giỏ hàng" hidden></div>
  <div class="tools">
    <div class="row1">
      <input class="search" id="q" type="search" placeholder="Tìm mã căn, ví dụ AS71-18" aria-label="Tìm mã căn">
      <label class="sort"><span>Sắp xếp</span><select id="sortSel">
        <option value="default">Còn hàng trước, giá thấp trước</option>
        <option value="price:1">Giá thấp đến cao</option><option value="price:-1">Giá cao đến thấp</option>
        <option value="perM2:1">Đơn giá thấp đến cao</option><option value="land:-1">Diện tích đất lớn đến nhỏ</option>
        <option value="code:1">Mã căn A đến Z</option><option value="custom" hidden>Theo cột đã chọn</option>
      </select></label>
      <button class="adv-btn" id="advBtn" aria-expanded="false">Lọc thêm <span class="badge" id="advCount" hidden></span></button>
    </div>
    <div class="adv" id="adv" hidden>
      <label class="fld"><span>Bàn giao</span><select id="fHandover"></select></label>
      <label class="fld"><span>Loại hình</span><select id="fType"></select></label>
      <label class="fld"><span>Khoảng giá</span><select id="fPrice"></select></label>
      <label class="fld"><span>Diện tích đất</span><select id="fLand"></select></label>
      <label class="fld"><span>Tình trạng</span><select id="fStatus"></select></label>
      <label class="fld"><span>Phân khu</span><select id="fZone"></select></label>
      <label class="fld"><span>Hướng</span><select id="fDirection"></select></label>
    </div>
  </div>

  <div class="resbar"><span id="resText">Đang tải...</span><button class="link" id="clearAll" hidden>Xóa bộ lọc</button></div>
  <div class="tw"><table><thead id="thead"></thead><tbody id="tbody"></tbody></table></div>
  <div class="cards" id="cards"></div>
  <div class="more" id="more" hidden><button id="moreBtn"></button></div>
  <p class="legal" id="legal"></p>
  </div>

  <div class="mbg" id="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="modal">
    <div class="mh">
      <div><h3 id="mTitle"></h3><div class="sub" id="mSub"></div></div>
      <div class="np" id="mPrice"></div>
      <button class="close" id="mPrev" aria-label="Căn trước">‹</button>
      <button class="close" id="mNext" aria-label="Căn sau">›</button>
      <button class="close" id="mClose" aria-label="Đóng">×</button>
    </div>
    <div class="mb">
      <div class="mleft" id="mLeft"></div>
      <div class="mright" id="mRight"></div>
    </div>
  </div></div>
  <div class="zoom" id="zoom" role="dialog" aria-modal="true" aria-label="Xem ảnh"><div class="zbar"><span id="zTitle"></span><span><a id="zOrig" target="_blank" rel="noopener">Ảnh gốc ↗</a> <button id="zClose" aria-label="Đóng">Đóng ×</button></span></div><img id="zImg" alt=""></div>
  <div class="toast" id="toast" role="status"></div>
</div>`;

  // ─── Tiện ích dùng chung ───
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase(); }
  function natural(a, b) { return String(a).localeCompare(String(b), 'vi', { numeric: true, sensitivity: 'base' }); }
  function num(n, d) { return Number(n).toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function ty(n) { return n ? num(n / 1e9, 2) + ' tỷ' : 'Liên hệ'; }
  function vnd(n) { return n ? Math.round(n).toLocaleString('vi-VN') + ' đồng' : ''; }
  function m2(n) { return n == null || n === '' ? '' : Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 1 }); }
  function perM2(u) { return u.price && u.land ? u.price / u.land : null; }
  function trieu(n) { return n ? num(n / 1e6, 1) + ' triệu/m²' : ''; }
  function when(iso) {
    var d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ngày ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function hashParams() { var h = new URLSearchParams(location.hash.replace(/^#/, '')); var q = new URLSearchParams(location.search); return { p: h.get('du-an') || q.get('p'), u: h.get('can') || q.get('u'), g: h.get('gio'), t: h.get('muc') }; }

  // ─── Chuẩn hóa cách ghi khác nhau giữa các sheet (LK / Liền kề, GIÃN XÂY / Giãn xây, "–"...) ───
  var EMPTY_MARKS = { '-': 1, '–': 1, '—': 1, '_': 1, '.': 1, 'n/a': 1, 'x': 1 };
  // Chuẩn hóa Unicode (NFC) và khoảng trắng: chữ gõ bằng hai kiểu mã hóa dấu khác nhau sẽ thành một.
  function blankish(v) { var t = String(v == null ? '' : v).normalize('NFC').replace(/[\s\u00a0\u200b]+/g, ' ').trim(); return EMPTY_MARKS[t.toLowerCase()] ? '' : t; }
  function cleanHandover(v) {
    var t = blankish(v); if (!t) return '';
    t = sentence(t).replace(/^bàn giao\s+/i, '').replace(/\s*[-–—]\s*/g, ' ').replace(/\s+/g, ' ').trim();
    t = t.replace(/^gi[àảaạ]n xây/i, 'giãn xây'); // lỗi gõ thường gặp trong sheet (Giản xây, Giàn xây)
    return t ? t.charAt(0).toLocaleUpperCase('vi-VN') + t.slice(1) : '';
  }
  function lowerVi(t) { return t.toLocaleLowerCase('vi-VN'); }
  function sentence(t) { t = lowerVi(t).replace(/\s+/g, ' '); return t.charAt(0).toLocaleUpperCase('vi-VN') + t.slice(1); }
  function titleCase(t) { return lowerVi(t).replace(/\s+/g, ' ').replace(/(^|\s)(\S)/g, function (m, a, b) { return a + b.toLocaleUpperCase('vi-VN'); }); }
  function cleanType(t) {
    t = blankish(t); if (!t) return '';
    var x = lowerVi(t).replace(/[(),;]/g, ' ').replace(/\s*[-–—]\s*/g, ' ').replace(/\s+/g, ' ').trim();
    x = x.replace(/^lk\b/, 'liền kề').replace(/^sl\b/, 'song lập').replace(/^(đl|dl)\b/, 'đơn lập').replace(/^bt\b/, 'biệt thự').replace(/^sh\b/, 'shophouse');
    x = x.replace(/\bgốc\b/g, 'góc');
    return x.charAt(0).toLocaleUpperCase('vi-VN') + x.slice(1);
  }
  function cleanUnit(u) {
    return {
      code: String(u.code || '').trim(), zone: blankish(u.zone) ? titleCase(blankish(u.zone)) : '', street: blankish(u.street),
      type: cleanType(u.type), direction: blankish(u.direction) ? titleCase(blankish(u.direction)) : '',
      handover: cleanHandover(u.handover),
      land: u.land, build: u.build != null ? Math.round(u.build * 10) / 10 : u.build, price: u.price, status: viewStatus(u.status),
      ptg: /^https:\/\//i.test(u.ptg || '') ? u.ptg : '', unitLink: /^https:\/\//i.test(u.unitLink || '') ? u.unitLink : '',
      priceExVat: u.priceExVat || null, priceLoan: u.priceLoan || null, priceEarly: u.priceEarly || null, priceProgress: u.priceProgress || null, fund: u.fund ? String(u.fund) : '', dq: !!u.dq,
      tags: Array.isArray(u.tags) ? u.tags.map(String).filter(Boolean).slice(0, 4) : []
    };
  }
  // Trạng thái hiển thị: gộp "Đang giữ chỗ" và "Liên hệ" thành "Check admin".
  var CHECK = 'Check admin';
  var STATUS_MERGE = { 'Đang giữ chỗ': CHECK, 'Liên hệ': CHECK };
  function viewStatus(s) { s = String(s || '').trim(); return STATUS_MERGE[s] || (s === 'Còn hàng' || s === 'Đã bán' ? s : CHECK); }
  function stCls(s) { return s === 'Còn hàng' ? 's-ok' : s === CHECK ? 's-hold' : s === 'Đã bán' ? 's-sold' : 's-other'; }
  function rank(s) { var r = { 'Còn hàng': 0, 'Check admin': 1, 'Đã bán': 3 }[s]; return r == null ? 2 : r; }
  // Khoảng chọn sẵn: [từ, dưới, nhãn]. Giá tính bằng tỷ, diện tích bằng m².
  var PRICE_BUCKETS = [[0, 7, 'Dưới 7 tỷ'], [7, 10, '7 – 10 tỷ'], [10, 15, '10 – 15 tỷ'], [15, 25, '15 – 25 tỷ'], [25, 40, '25 – 40 tỷ'], [40, 1e4, 'Từ 40 tỷ']];
  var LAND_BUCKETS = [[0, 60, 'Dưới 60 m²'], [60, 80, '60 – 80 m²'], [80, 100, '80 – 100 m²'], [100, 150, '100 – 150 m²'], [150, 250, '150 – 250 m²'], [250, 1e6, 'Từ 250 m²']];

  // ─── Tải dữ liệu: một lần dùng chung cho mọi khối trên trang ───
  var shared = null;
  function jsonp(url) {
    return new Promise(function (resolve, reject) {
      var cb = '__adlcb' + Date.now() + Math.floor(Math.random() * 1000);
      var s = document.createElement('script');
      var timer = setTimeout(function () { cleanup(); reject(new Error('timeout')); }, 25000);
      function cleanup() { clearTimeout(timer); try { delete window[cb]; } catch (e) { window[cb] = undefined; } s.remove(); }
      var done = false;
      window[cb] = function (d) { done = true; cleanup(); resolve(d); };
      s.onerror = function () { cleanup(); reject(new Error('network')); };
      // Tải xong mà không gọi lại: máy chủ trả trang đăng nhập/lỗi thay vì dữ liệu (chưa cấp quyền, sai link).
      s.onload = function () { setTimeout(function () { if (!done) { cleanup(); reject(new Error('invalid')); } }, 50); };
      s.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'api=public&callback=' + cb + '&t=' + Date.now();
      document.head.appendChild(s);
    });
  }
  // Nhớ dữ liệu lần xem trước trong trình duyệt: khách quay lại thấy bảng ngay, rồi mới cập nhật bản mới.
  var LOCAL_KEY = 'adl_bang_hang_v1';
  function readLocal() {
    try {
      var d = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
      if (!d || !d.ok || d.api !== C.API_URL) return null;
      if (Date.now() - new Date(d.updatedAt).getTime() > 24 * 3600 * 1000) return null; // quá 1 ngày thì bỏ
      return d;
    } catch (e) { return null; }
  }
  function writeLocal(d) { try { d.api = C.API_URL; localStorage.setItem(LOCAL_KEY, JSON.stringify(d)); } catch (e) { /* hết chỗ hoặc bị chặn: bỏ qua */ } }
  function fetchData(force) {
    if (shared && !force) return shared;
    var demo = new URLSearchParams(location.search).get('demo') === '1';
    shared = (demo ? Promise.resolve(demoData()) : jsonp(C.API_URL)).then(function (d) {
      if (!d || !d.ok) throw new Error((d && d.error) ? 'bad' : 'bad');
      d.demo = demo;
      if (!demo) writeLocal(d);
      return d;
    });
    shared.catch(function () { shared = null; });
    return shared;
  }

  function mount(host) {
    if (host.__adl) return; host.__adl = true;
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML = '<style>' + CSS + '</style>' + HTML;
    if (/^#[0-9a-f]{6}$/i.test(C.brandColor || '')) { var wEl = root.querySelector('.w'); wEl.style.setProperty('--brand', C.brandColor); wEl.style.setProperty('--brand-soft', C.brandColor + '14'); }
    var $ = function (id) { return root.getElementById ? root.getElementById(id) : root.querySelector('#' + id); };
    var lockProject = host.getAttribute('data-du-an') || '';
    var useHash = host.getAttribute('data-lien-ket') !== '0';
    if (host.getAttribute('data-tieu-de') === '0') $('hero').hidden = true;
    var state = null;
    state = { data: null, projects: [], project: null, units: [], filter: blank(), sort: { key: 'default', dir: 1 }, current: null, shown: C.pageSize };
    function blank() { return { q: '', zone: '', type: '', direction: '', handover: '', land: '', price: '', status: '', dq: state && state.filter ? state.filter.dq : (host.getAttribute('data-gio') === 'dq' ? '1' : '') }; }
    function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2600); }

    // Khung chờ khi đang tải
    $('tbody').innerHTML = new Array(6).join('<tr class="skel">' + new Array(8).join('<td><span></span></td>') + '</tr>');

    function load(silent, force) {
      return fetchData(force).then(function (d) { apply(d, silent); }).catch(function (err) { fail(err, silent); });
    }
    function apply(d, silent) {
      (function () {
        state.data = d;
        var order = C.projectOrder || [];
        var projects = d.projects.slice().sort(function (a, b) { return (order.indexOf(a.id) + 99) % 99 - (order.indexOf(b.id) + 99) % 99; });
        if (lockProject) projects = projects.filter(function (p) { return p.id === lockProject; });
        if (!projects.length) throw new Error('noproject');
        state.projects = projects;
        // Ẩn ngay các khối Tabs soạn bằng UX Builder (nội dung đã đưa vào thanh tab của bảng hàng).
        projects.forEach(function (p) { try { pageTabsFor(p.id); } catch (e) { /* bỏ qua */ } });
        $('projects').hidden = projects.length < 2;
        $('projects').innerHTML = projects.map(function (p) { return '<button role="tab" data-p="' + esc(p.id) + '">' + esc(p.name) + '</button>'; }).join('');
        var hp = hashParams();
        if (!silent && hp.g === 'dq') state.filter.dq = '1';
        var want = state.project ? state.project.id : hp.p;
        selectProject(projects.some(function (x) { return x.id === want; }) ? want : projects[0].id, silent);
        if (!silent && hp.u) { var u = findCode(hp.u); if (u) openUnit(u); }
      })();
    }
    function fail(err, silent) {
      (function () {
        if (silent) return;
        var code = (err && err.message) || 'unknown';
        var why = { timeout: 'máy chủ dữ liệu phản hồi quá lâu', network: 'không kết nối được máy chủ dữ liệu', invalid: 'máy chủ dữ liệu chưa sẵn sàng', bad: 'máy chủ dữ liệu báo lỗi', noproject: 'không có dự án phù hợp' }[code] || code;
        if (window.console) console.warn('[Bảng hàng ADL] Lỗi tải dữ liệu:', code, C.API_URL);
        var msg = '<div class="empty">Bảng hàng đang được cập nhật. Vui lòng gọi <b>' + esc(C.hotlineText) + '</b> để nhận giỏ hàng mới nhất.' +
          '<br><small style="opacity:.7">Mã lỗi: ' + esc(code) + ' (' + esc(why) + ')</small></div>';
        $('tbody').innerHTML = '<tr><td colspan="9">' + msg + '</td></tr>'; $('cards').innerHTML = msg;
        $('resText').textContent = ''; $('hName').textContent = 'Bảng hàng dự án';
      })();
    }
    $('projects').onclick = function (e) { var b = e.target.closest('button'); if (b) { selectProject(b.dataset.p); updateHash(); } };

    function selectProject(id, keep) {
      var changed = !state.project || state.project.id !== id;
      state.project = state.projects.filter(function (p) { return p.id === id; })[0];
      state.units = state.project.units.map(cleanUnit);
      if (changed && !keep) { state.filter = blank(); state.shown = C.pageSize; $('q').value = ''; }
      Array.prototype.forEach.call($('projects').children, function (b) { b.classList.toggle('on', b.dataset.p === id); b.setAttribute('aria-selected', String(b.dataset.p === id)); });
      var upd = when(state.data.updatedAt);
      $('hName').textContent = state.project.name;
      var pl = projectLink(); $('hLink').hidden = !pl; if (pl) { $('hLink').href = pl; $('hLink').title = 'Xem thông tin dự án ' + state.project.name; }
      $('hSub').textContent = (state.data.demo ? 'Dữ liệu minh họa. ' : '') + 'Bảng giá tham khảo do ' + C.brandName + ' tư vấn, cập nhật lúc ' + upd + '.';
      $('legal').textContent = 'Giá niêm yết đã gồm VAT và kinh phí bảo trì, theo bảng hàng cập nhật lúc ' + upd +
        '. Đơn giá tính bằng giá niêm yết chia diện tích đất. Giá và chính sách có thể thay đổi theo sản phẩm, thời điểm và xác nhận của chủ đầu tư.' +
        (state.project.incomplete ? ' Một phần giỏ hàng đang cập nhật, vui lòng gọi hotline để có danh sách đầy đủ.' : '');
      host.dispatchEvent(new CustomEvent('adl:update', { bubbles: true, detail: { project: { id: state.project.id, name: state.project.name }, updatedAt: state.data.updatedAt, demo: !!state.data.demo } }));
      buildOptions(); render();
      if (!keep || changed) showTab(curTab, false);
    }

    function projectLink() { var l = (C.projectLinks || {})[state.project && state.project.id]; return /^https:\/\//i.test(l || '') ? l : ''; }


    // ─── Tab thông tin dự án: nội dung lấy từ trang dự án WordPress, chia theo tiêu đề H2 ───
    var TICON = {
      globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
      pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
      grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
      map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
      house: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
      doc: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
      cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
      book: '<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z"/><path d="M12 6v14"/>',
      news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
      file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M12 11v6M9 14l3 3 3-3"/>'
    };
    function ticon(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (TICON[n] || '') + '</svg>'; }
    var TABS = (C.tabs || []).filter(function (t) { return t && t.id; });
    var curTab = (TABS.some(function (t) { return t.id === host.getAttribute('data-muc'); }) && host.getAttribute('data-muc')) || C.defaultTab || 'quy-can';
    (function () { var t = hashParams().t; if (t && TABS.some(function (x) { return x.id === t; })) curTab = t; })();
    $('ptabs').hidden = TABS.length < 2;
    $('ptabs').innerHTML = TABS.map(function (t) { return '<button role="tab" data-t="' + esc(t.id) + '">' + ticon(t.icon) + esc(t.label) + '</button>'; }).join('');
    $('ptabs').onclick = function (e) { var b = e.target.closest('button'); if (b) { showTab(b.dataset.t, true); updateHash(); } };

    function showTab(id, scroll) {
      if (!TABS.some(function (t) { return t.id === id; })) id = 'quy-can';
      curTab = id;
      Array.prototype.forEach.call($('ptabs').children, function (b) { var on = b.dataset.t === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); if (on) { var bar = $('ptabs'); bar.scrollLeft = Math.max(0, b.offsetLeft - (bar.clientWidth - b.offsetWidth) / 2); } });
      var quy = id === 'quy-can';
      $('pQuy').hidden = !quy; $('pInfo').hidden = quy;
      if (!quy) renderInfo();
      if (scroll) { var r = $('ptabs').getBoundingClientRect(); if (r.top < 0) window.scrollBy(0, r.top - 8); }
    }

    var infoCache = {};
    function pageApi(link) {
      var m = /^(https:\/\/[^/]+)\/(.*?)\/?$/.exec(link || ''); if (!m) return '';
      var slug = m[2].split('/').filter(Boolean).pop();
      return slug ? m[1] + '/wp-json/wp/v2/pages?slug=' + encodeURIComponent(slug) + '&_fields=content,modified,link' : '';
    }
    function getJSON(url) {
      return fetch(url, { credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); });
    }
    // Nội dung các tab lấy theo thứ tự ưu tiên, từng tab riêng:
    //   1. Khối Tabs (Flatsome UX Builder) ngay trên trang này, tiêu đề khối là tên dự án;
    //   2. Trang nội dung riêng (contentPages);  3. Trang dự án (projectLinks).
    // Tab nào nguồn trên chưa có thì lấy từ nguồn dưới.
    function loadInfo(pid) {
      if (infoCache[pid]) return Promise.resolve(withPageTabs(infoCache[pid], pid));
      var key = 'adl_info_v3_' + pid, cached = null;
      try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { cached = null; }
      var fresh = cached && Date.now() - cached.t < 30 * 60 * 1000;
      var urls = [pageApi((C.projectLinks || {})[pid]), pageApi((C.contentPages || {})[pid])]; // thấp → cao
      var net = Promise.all(urls.map(function (u) {
        if (!u) return null;
        return getJSON(u).then(function (arr) {
          var pg = arr && arr[0];
          return pg && pg.content && pg.content.rendered ? { modified: pg.modified, link: pg.link, html: pg.content.rendered } : null;
        }, function () { return null; });
      })).then(function (pages) {
        if (!pages.some(Boolean)) throw new Error('nopage');
        var d = { t: Date.now(), pages: pages };
        try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) { /* bỏ qua */ }
        return d;
      });
      var build = function (d) { return (infoCache[pid] = mergeInfo(d.pages.map(function (pg) { return pg ? parseInfo(pg) : null; }))); };
      if (cached) {
        if (!fresh) net.then(function (d) { build(d); if (state.project && state.project.id === pid && curTab !== 'quy-can') renderInfo(); }).catch(function () {});
        return Promise.resolve(withPageTabs(build(cached), pid));
      }
      return net.then(build, function (e) { if (pageTabsFor(pid)) return mergeInfo([]); throw e; }).then(function (info) { return withPageTabs(info, pid); });
    }
    /** Gộp nhiều nguồn (thấp → cao): mỗi tab lấy từ nguồn cao nhất có tab đó. */
    function mergeInfo(list) {
      var out = { byTab: {}, docs: [], layouts: [], link: '' }, owner = {};
      list.forEach(function (info, i) {
        if (!info) return;
        Object.keys(info.byTab).forEach(function (t) { if (info.byTab[t].length) { out.byTab[t] = info.byTab[t]; owner[t] = i; } });
        out.docs = (info.docs || []).concat(out.docs);
        if (info.link) out.link = info.link;
      });
      list.forEach(function (info, i) {
        if (info) out.layouts = out.layouts.concat((info.layouts || []).filter(function (l) { return owner[l.tab] === i; }));
      });
      return out;
    }
    // Khối Tabs của Flatsome trên trang: tìm theo tiêu đề khối (tên dự án), đổi thành HTML chuẩn cho các tab.
    var pageTabsMemo = {};
    function pageTabsFor(pid) {
      if (pid in pageTabsMemo) return pageTabsMemo[pid];
      var proj = state.projects.filter(function (p) { return p.id === pid; })[0], html = '';
      var inBuilder = window.self !== window.top || /uxb/i.test(location.search);
      Array.prototype.forEach.call(document.querySelectorAll('.tabbed-content'), function (box) {
        if (host.contains(box)) return;
        var titleEl = box.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
        var prev = box.previousElementSibling;
        var title = (titleEl ? titleEl.textContent : '') + ' ' + (prev && /^(H[1-6]|P|DIV)$/.test(prev.tagName) && (prev.textContent || '').length < 120 ? prev.textContent : '');
        var nt = norm(title);
        var mine = proj && (nt.indexOf(norm(proj.name)) >= 0 || nt.split(/\s+/).indexOf(norm(pid)) >= 0 || (state.projects.length === 1 && /noi dung|bang hang|tab/.test(nt)));
        if (!mine) return;
        var links = box.querySelectorAll('.nav li a'), panels = box.querySelectorAll('.tab-panels > .panel');
        Array.prototype.forEach.call(links, function (a, i) {
          var id = (a.getAttribute('aria-controls') || (a.getAttribute('href') || '').replace(/^#/, ''));
          var panel = (id && document.getElementById(id)) || panels[i];
          if (!panel) return;
          var label = (a.textContent || '').replace(/\s+/g, ' ').trim(), nl = norm(label);
          var tab = TABS.filter(function (t) { return t.match && (norm(t.label) === nl || t.match.some(function (w) { return nl.indexOf(w) >= 0; })); })[0];
          if (!tab) return;
          // Tiêu đề H2 bên trong ô đổi thành H3 để cả ô nằm trọn trong một tab.
          html += '<h2>' + esc(tab.label) + '</h2>' + panel.innerHTML.replace(/<(\/?)h2\b/gi, '<$1h3');
        });
        if (!inBuilder) { box.style.display = 'none'; if (titleEl == null && prev && prev !== host && !prev.contains(host) && (prev.textContent || '').length < 120 && /^H[1-6]$/.test(prev.tagName)) prev.style.display = 'none'; }
      });
      return (pageTabsMemo[pid] = html ? parseInfo({ html: html, link: location.href }) : null);
    }
    function withPageTabs(info, pid) {
      var pt = pageTabsFor(pid);
      return pt ? mergeInfo([info, pt]) : info;
    }

    // Chuyển HTML trang dự án thành các khối gọn (tiêu đề, đoạn, danh sách, ảnh, bảng, video), bỏ form và mã thừa.
    function inline(node) {
      var out = '';
      node.childNodes.forEach(function (c) {
        if (c.nodeType === 3) { out += esc(c.nodeValue); return; }
        if (c.nodeType !== 1) return;
        var t = c.tagName;
        // Nhãn và giá trị đặt trong hai thẻ riêng (ví dụ <b>Quy mô</b><span>1.080 ha</span>): thêm dấu ngăn cho dễ đọc.
        if ((t === 'SPAN' || t === 'DIV' || t === 'P') && out && !/(\s|<br>)$/.test(out)) { var pv = c.previousElementSibling; out += pv && (pv.tagName === 'B' || pv.tagName === 'STRONG') ? ': ' : ' '; }
        if (t === 'BR') out += '<br>';
        else if (t === 'A') { var h = c.getAttribute('href') || ''; var x = inline(c); out += /^https?:\/\//i.test(h) ? '<a href="' + esc(h) + '" target="_blank" rel="noopener">' + x + '</a>' : x; }
        else if (t === 'STRONG' || t === 'B') out += '<b>' + inline(c) + '</b>';
        else if (t === 'EM' || t === 'I') out += '<i>' + inline(c) + '</i>';
        else if (t !== 'IMG' && t !== 'SVG' && t !== 'svg' && t !== 'SCRIPT' && t !== 'STYLE') out += inline(c);
      });
      return out;
    }
    function imgSrc(im) {
      var s = im.getAttribute('data-src') || im.getAttribute('data-lazy-src') || im.getAttribute('src') || '';
      if (!/^https?:\/\//i.test(s) || /\.svg(\?|$)/i.test(s)) return '';
      var w = +(im.getAttribute('width') || 0); if (w && w < 120) return '';
      return s;
    }
    function parseInfo(d) {
      var doc = new DOMParser().parseFromString('<div>' + (d.html || '') + '</div>', 'text/html');
      Array.prototype.forEach.call(doc.querySelectorAll('script,style,noscript,form,.wpcf7,button,input,select,textarea,.mfp-hide,.lightbox-content,.hidden,[style*="display:none"],[style*="display: none"]'), function (n) { n.remove(); });
      var blocks = [], seen = {}, docs = [], ctxH2 = '', ctxH3 = '';
      Array.prototype.forEach.call(doc.querySelectorAll('a[href]'), function (a) {
        var h = a.getAttribute('href');
        if (/\.pdf(\?|#|$)/i.test(h) || /drive\.google\.com\/(file|drive)|docs\.google\.com/i.test(h)) docs.push({ label: (a.textContent || '').trim() || decodeURIComponent(h.split('/').pop()), url: h });
      });
      Array.prototype.forEach.call(doc.querySelectorAll('h2,h3,h4,p,ul,ol,table,img,iframe,blockquote,figcaption'), function (el) {
        if (el.parentElement && el.parentElement.closest('ul,ol,table,blockquote')) return;
        var t = el.tagName.toLowerCase(), txt;
        if (t === 'img') {
          var src = imgSrc(el), key = src.replace(/-\d+x\d+(?=\.\w+$)/, '');
          if (src && !seen[key]) {
            seen[key] = 1;
            // Ảnh gốc lớn nhất trong srcset để xem chi tiết mặt bằng.
            var full = src, best = 0;
            (el.getAttribute('data-srcset') || el.getAttribute('srcset') || '').split(',').forEach(function (c) { var m = /^\s*(\S+)\s+(\d+)w/.exec(c); if (m && +m[2] > best && /^https?:\/\//.test(m[1])) { best = +m[2]; full = m[1]; } });
            blocks.push({ t: 'img', src: src, full: full, alt: el.getAttribute('alt') || '', ctx: ctxH3 || ctxH2 });
          }
          return;
        }
        if (t === 'iframe') { var u = el.getAttribute('data-src') || el.getAttribute('src') || ''; if (/^https:\/\/(www\.)?(youtube(-nocookie)?\.com|player\.vimeo\.com|www\.google\.com\/maps)/i.test(u)) blocks.push({ t: 'vid', src: u }); return; }
        if (t === 'ul' || t === 'ol') { var items = Array.prototype.map.call(el.querySelectorAll(':scope > li'), function (li) { return inline(li).trim(); }).filter(Boolean); if (items.length) blocks.push({ t: t, items: items }); return; }
        if (t === 'table') { var rows = Array.prototype.map.call(el.querySelectorAll('tr'), function (tr) { return Array.prototype.map.call(tr.children, function (c) { return inline(c).trim(); }); }).filter(function (r) { return r.join(''); }); if (rows.length) blocks.push({ t: 'table', rows: rows }); return; }
        txt = (t === 'h2' || t === 'h3' || t === 'h4') ? (el.textContent || '').replace(/\s+/g, ' ').trim() : inline(el).replace(/^\s+|\s+$/g, '');
        if (t === 'h2') { ctxH2 = txt; ctxH3 = ''; } else if (t === 'h3') ctxH3 = txt;
        if (!txt || !/[0-9A-Za-zÀ-ỹ]/.test(txt.replace(/<[^>]+>/g, ''))) return;
        blocks.push({ t: t === 'figcaption' ? 'cap' : t === 'blockquote' ? 'quote' : t, x: txt });
      });
      // Chia thành các mục theo H2, bỏ các mục và tiêu đề con thuộc danh sách bỏ qua.
      var secs = [], cur = { title: '', blocks: [] }, skipLevel = 0;
      var skipWords = (C.skipHeadings || []).map(norm);
      blocks.forEach(function (b) {
        var lvl = b.t === 'h2' ? 2 : b.t === 'h3' ? 3 : b.t === 'h4' ? 4 : 0;
        if (lvl && skipLevel && lvl > skipLevel) return;
        if (lvl) skipLevel = 0;
        if (lvl && skipWords.some(function (w) { return norm(b.x).indexOf(w) === 0 || norm(b.x).indexOf(' ' + w) >= 0 && w.indexOf('nhan') !== 0; })) { skipLevel = lvl; if (lvl === 2) { secs.push(cur); cur = { title: '', blocks: [], skip: true }; } return; }
        if (skipLevel) return;
        if (lvl === 2) { secs.push(cur); cur = { title: b.x, blocks: [] }; return; }
        cur.blocks.push(b);
      });
      secs.push(cur);
      var byTab = {}, order = C.tabPriority || [];
      secs.forEach(function (sec, i) {
        if (sec.skip || !sec.blocks.length) return;
        var n = norm(sec.title), tab = '';
        if (!sec.title) tab = 'tong-quan';
        order.some(function (id) { var t = TABS.filter(function (x) { return x.id === id; })[0]; if (t && (t.match || []).some(function (w) { return n.indexOf(w) >= 0; })) { tab = id; return true; } return false; });
        if (!tab) tab = TABS.some(function (x) { return x.id === 'tong-quan'; }) ? 'tong-quan' : '';
        if (!tab) return;
        (byTab[tab] = byTab[tab] || []).push({ id: 's' + i, title: sec.title, blocks: sec.blocks });
      });
      // Thư viện mặt bằng: ảnh trong mục Mặt bằng, Phân khu và ảnh có chú thích liên quan đến mặt bằng, thiết kế.
      var lw = (C.layoutWords || []).map(norm), layouts = [];
      Object.keys(byTab).forEach(function (tb) {
        byTab[tb].forEach(function (sec) {
          sec.blocks.forEach(function (b) {
            if (b.t !== 'img') return;
            // Xếp nhóm theo chú thích riêng của ảnh (alt, tên file); chỉ dùng tiêu đề mục khi ảnh không có chú thích.
            var own = norm(b.alt + ' ' + b.src.split('/').pop().replace(/[-_]/g, ' ')), hay = own + ' ' + norm(b.ctx);
            if (tb !== 'mat-bang' && tb !== 'phan-khu' && !lw.some(function (w) { return hay.indexOf(w) >= 0; })) return;
            if (/ket noi|di chuyen|vi tri|tien do|cong truong/.test(own) && !/mat bang/.test(own)) return; // bản đồ vị trí, ảnh tiến độ: thuộc tab khác
            var by = b.alt ? own : hay;
            var g = /mau|kien truc|thiet ke|shophouse|biet thu|nha pho|can ho|san pham/.test(by) ? 'Sản phẩm, thiết kế'
              : /tong the|toan khu|quy hoach/.test(by) ? 'Mặt bằng tổng thể' : 'Phân khu, tiện ích';
            layouts.push({ title: b.alt || b.ctx || 'Mặt bằng', src: b.src, full: b.full || b.src, group: g, tab: tb });
          });
        });
      });
      return { byTab: byTab, docs: docs, layouts: layouts, link: d.link, modified: d.modified };
    }

    function renderBlocks(blocks) {
      var out = '', i = 0;
      while (i < blocks.length) {
        var b = blocks[i];
        if (b.t === 'img') {
          var g = []; while (i < blocks.length && blocks[i].t === 'img') g.push(blocks[i++]);
          var pic = function (x) { return '<div class="pic" data-z="' + esc(x.src) + '" data-a="' + esc(x.alt) + '"><img loading="lazy" src="' + esc(x.src) + '" alt="' + esc(x.alt) + '"></div>'; };
          out += g.length === 1 ? pic(g[0]) : '<div class="gal" style="--g:' + (g.length % 3 === 0 ? 3 : 2) + '">' + g.map(pic).join('') + '</div>';
          continue;
        }
        if (b.t === 'h3' || b.t === 'h4') out += '<' + b.t + ' id="' + esc(b.id || '') + '">' + esc(b.x) + '</' + b.t + '>';
        else if (b.t === 'p') out += '<p>' + b.x + '</p>';
        else if (b.t === 'cap') out += '<p class="cap">' + b.x + '</p>';
        else if (b.t === 'quote') out += '<blockquote>' + b.x + '</blockquote>';
        else if (b.t === 'ul' || b.t === 'ol') out += '<' + b.t + '>' + b.items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</' + b.t + '>';
        else if (b.t === 'table') out += '<div class="tbl"><table>' + b.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>';
        else if (b.t === 'vid') out += '<div class="vid"><iframe loading="lazy" src="' + esc(b.src) + '" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
        i++;
      }
      return out;
    }
    function ctaHtml(label) {
      var pl = projectLink();
      return '<div class="cta"><div><b>Cần tư vấn ' + esc(label.toLowerCase()) + ' ' + esc(state.project.name) + '?</b><span>' + esc(C.brandName) + ' gửi thông tin mới nhất qua điện thoại hoặc Zalo.</span></div>' +
        '<div class="btns"><a class="call" href="tel:' + esc(C.hotline) + '" data-track="goi">' + ICON.phone + 'Gọi ' + esc(C.hotlineText) + '</a><a href="' + esc(C.zalo) + '" target="_blank" rel="noopener" data-track="zalo">' + ICON.chat + 'Nhắn Zalo</a></div></div>' +
        (pl ? '<p class="src">Xem đầy đủ tại trang <a href="' + esc(pl) + '" target="_blank" rel="noopener">' + esc(state.project.name) + ' ↗</a></p>' : '');
    }
    // Tab Mặt bằng Layout: thư viện file mặt bằng, chia nhóm, xem toàn màn hình hoặc mở ảnh gốc.
    function layoutGallery(info, pid) {
      var extra = ((C.layouts || {})[pid] || []).filter(function (x) { return x && /^https:\/\//i.test(x.url); }).map(function (x) {
        var isImg = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(x.url);
        return { title: x.title || 'Mặt bằng', src: isImg ? x.url : '', full: x.url, group: x.group || 'Tài liệu mặt bằng', file: !isImg };
      });
      var fileDocs = (info.docs || []).filter(function (d) { return /mat bang|layout|tmb|thiet ke/.test(norm(d.label + ' ' + d.url)); })
        .map(function (d) { return { title: d.label, src: '', full: d.url, group: 'Tài liệu mặt bằng', file: true }; });
      var order = ['Mặt bằng tổng thể', 'Phân khu, tiện ích', 'Sản phẩm, thiết kế', 'Tài liệu mặt bằng'];
      var items = extra.concat(info.layouts || [], fileDocs);
      items.sort(function (a, b) { return (order.indexOf(a.group) + 9) % 9 - (order.indexOf(b.group) + 9) % 9; });
      if (!items.length) return '';
      var groups = []; items.forEach(function (x) { if (groups.indexOf(x.group) < 0) groups.push(x.group); });
      var count = function (g) { return items.filter(function (x) { return x.group === g; }).length; };
      return '<div class="sec"><h2>Mặt bằng &amp; layout thiết kế</h2><p>Mặt bằng tổng thể, mặt bằng phân khu và mẫu thiết kế ' + esc(state.project.name) + '. Bấm vào ảnh để xem toàn màn hình, mở ảnh gốc để xem rõ chi tiết.</p>' +
        (groups.length > 1 ? '<div class="lchips"><button class="on" data-g="">Tất cả <b>' + items.length + '</b></button>' + groups.map(function (g) { return '<button data-g="' + esc(g) + '">' + esc(g) + ' <b>' + count(g) + '</b></button>'; }).join('') + '</div>' : '') +
        '<div class="lgrid">' + items.map(function (x) {
          return '<div class="lcard" data-g="' + esc(x.group) + '">' +
            (x.file ? '<a class="lthumb file" href="' + esc(x.full) + '" target="_blank" rel="noopener">' + ticon('file') + '<span>Mở tài liệu</span></a>'
              : '<div class="lthumb pic" data-z="' + esc(x.full) + '" data-a="' + esc(x.title) + '"><img loading="lazy" src="' + esc(x.src) + '" alt="' + esc(x.title) + '"></div>') +
            '<div class="lmeta"><i>' + esc(x.group) + '</i><b>' + esc(x.title) + '</b><div class="lact">' +
            (x.file ? '' : '<button class="lzoom" data-z="' + esc(x.full) + '" data-a="' + esc(x.title) + '">Phóng to</button>') +
            '<a href="' + esc(x.full) + '" target="_blank" rel="noopener">' + (x.file ? 'Mở file ↗' : 'Ảnh gốc ↗') + '</a></div></div></div>';
        }).join('') + '</div></div>';
    }
    function newsHtml(pid) {
      var words = (C.newsSearch || {})[pid] || [state.project.name];
      var origin = (/^(https:\/\/[^/]+)/.exec((C.projectLinks || {})[pid] || '') || [])[1];
      if (!origin) return Promise.resolve('');
      return Promise.all(words.map(function (w) {
        return getJSON(origin + '/wp-json/wp/v2/posts?search=' + encodeURIComponent(w) + '&per_page=12&_embed=wp:featuredmedia&_fields=title,link,date,excerpt,_links,_embedded').catch(function () { return []; });
      })).then(function (lists) {
        var all = {}, nw = words.map(norm);
        [].concat.apply([], lists).forEach(function (p) { if (p && p.link && !all[p.link]) all[p.link] = p; });
        var posts = Object.keys(all).map(function (k) { var p = all[k], tt = norm(p.title && p.title.rendered); p._hit = nw.some(function (w) { return tt.indexOf(w) >= 0; }) ? 1 : 0; return p; })
          .sort(function (a, b) { return b._hit - a._hit || String(b.date).localeCompare(String(a.date)); }).slice(0, 9);
        var txt = function (h) { var d = document.createElement('div'); d.innerHTML = h || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
        return posts.map(function (p) {
          var m = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0], sz = m && m.media_details && m.media_details.sizes;
          var img = (sz && (sz.medium_large || sz.large || sz.medium) || {}).source_url || (m && m.source_url) || '';
          var dt = new Date(p.date);
          return '<a class="post" href="' + esc(p.link) + '" target="_blank" rel="noopener"><div class="im"' + (/^https:\/\//.test(img) ? ' style="background-image:url(\'' + esc(img) + '\')"' : '') + '></div><div class="tx"><time>' +
            dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + '</time><b>' + esc(txt(p.title && p.title.rendered)) + '</b><p>' + esc(txt(p.excerpt && p.excerpt.rendered)) + '</p></div></a>';
        }).join('');
      });
    }
    var infoSeq = 0;
    function renderInfo() {
      var tab = TABS.filter(function (t) { return t.id === curTab; })[0]; if (!tab || !state.project) return;
      var pid = state.project.id, seq = ++infoSeq, box = $('pInfo');
      if (tab.id === 'tin-tuc') {
        box.innerHTML = '<div class="iload">Đang tải tin tức...</div>';
        newsHtml(pid).then(function (h) {
          if (seq !== infoSeq) return;
          box.innerHTML = (h ? '<div class="news">' + h + '</div>' : '<div class="iload">Chưa có bài viết về dự án này.</div>') + ctaHtml('dự án');
          wireInfo();
          track('xem_muc', { code: 'tin-tuc' });
        });
        return;
      }
      if (!infoCache[pid]) box.innerHTML = '<div class="iload">Đang tải nội dung ' + esc(tab.label.toLowerCase()) + '...</div>';
      loadInfo(pid).then(function (info) {
        if (seq !== infoSeq) return;
        var secs = info.byTab[tab.id] || [], pre = '';
        if (tab.id === 'mat-bang') {
          // Ảnh đã nằm trong thư viện phía trên; phần chữ của mục Mặt bằng giữ lại bên dưới.
          pre = layoutGallery(info, pid);
          secs = secs.map(function (sec) { return { id: sec.id, title: sec.title, blocks: sec.blocks.filter(function (b) { return b.t !== 'img'; }) }; })
            .filter(function (sec) { return sec.blocks.some(function (b) { return b.t === 'p' || b.t === 'ul' || b.t === 'ol' || b.t === 'table'; }); });
        }
        if (tab.id === 'tai-lieu') {
          var docs = ((C.docs || {})[pid] || []).concat(info.docs), seenU = {};
          docs = docs.filter(function (d) { if (!d || !/^https:\/\//i.test(d.url) || seenU[d.url]) return false; seenU[d.url] = 1; return true; });
          pre = '<div class="sec"><h2>Tài liệu dự án</h2>' + (docs.length ? '<div class="docs">' + docs.map(function (d) { return '<a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + ticon('file') + '<span>' + esc(d.label) + '</span><i>↗</i></a>'; }).join('') + '</div>'
            : '<p>Bộ tài liệu dự án (mặt bằng, chính sách, phiếu tính giá, pháp lý) được gửi trực tiếp qua Zalo. Bấm "Nhắn Zalo" bên dưới để nhận bản mới nhất.</p>') + '</div>';
        }
        var body = pre + secs.map(function (sec) {
          var bl = sec.blocks.map(function (b, j) { return (b.t === 'h3') ? Object.assign({}, b, { id: sec.id + '-' + j }) : b; });
          return '<div class="sec" id="' + sec.id + '">' + (sec.title ? '<h2>' + esc(sec.title) + '</h2>' : '') + renderBlocks(bl) + '</div>';
        }).join('');
        if (!body) body = '<div class="sec"><h2>' + esc(tab.label) + '</h2><p>Nội dung đang được cập nhật. Vui lòng liên hệ để nhận thông tin ' + esc(tab.label.toLowerCase()) + ' mới nhất.</p></div>';
        var toc = [];
        secs.forEach(function (sec) {
          if (sec.title) toc.push('<a href="#" data-to="' + sec.id + '">' + esc(sec.title) + '</a>');
          sec.blocks.forEach(function (b, j) { if (b.t === 'h3' && secs.length < 4) toc.push('<a class="sub" href="#" data-to="' + sec.id + '-' + j + '">' + esc(b.x) + '</a>'); });
        });
        var showToc = toc.length >= 3;
        box.innerHTML = '<div class="info' + (showToc ? '' : ' solo') + '">' + (showToc ? '<aside class="toc"><b>Nội dung</b>' + toc.slice(0, 18).join('') + '</aside>' : '') +
          '<div><article class="doc">' + body + '</article>' + ctaHtml(tab.label) + '</div></div>';
        wireInfo();
        track('xem_muc', { code: tab.id });
      }).catch(function () {
        if (seq !== infoSeq) return;
        var pl = projectLink();
        box.innerHTML = '<div class="iload">Chưa tải được nội dung. ' + (pl ? '<a href="' + esc(pl) + '" target="_blank" rel="noopener">Xem trang ' + esc(state.project.name) + ' ↗</a>' : '') + '</div>' + ctaHtml(tab.label);
        wireInfo();
      });
    }
    function wireInfo() {
      var box = $('pInfo');
      box.onclick = function (e) {
        var ch = e.target.closest('.lchips button');
        if (ch) {
          Array.prototype.forEach.call(ch.parentNode.children, function (x) { x.classList.toggle('on', x === ch); });
          Array.prototype.forEach.call(box.querySelectorAll('.lcard'), function (c) { c.hidden = !!ch.dataset.g && c.dataset.g !== ch.dataset.g; });
          return;
        }
        var z = e.target.closest('.pic, .lzoom');
        if (z) { openZoom(z.dataset.z, z.dataset.a || state.project.name, z.dataset.z); return; }
        var to = e.target.closest('[data-to]');
        if (to) { e.preventDefault(); var el = root.getElementById ? root.getElementById(to.dataset.to) : null; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        var tr = e.target.closest('[data-track]');
        if (tr) track(tr.dataset.track, null);
      };
    }

    // ─── Bộ lọc: các ô chọn thả xuống, mỗi lựa chọn kèm số căn theo các lọc còn lại ───
    function coverage(k) { return state.units.length ? state.units.filter(function (u) { return u[k]; }).length / state.units.length : 0; }
    function inBucket(v, b, mul) { return v != null && v >= b[0] * mul && v < b[1] * mul; }
    var FIELDS = {
      fHandover: { k: 'handover' }, fType: { k: 'type' }, fZone: { k: 'zone' }, fDirection: { k: 'direction' },
      fStatus: { k: 'status', order: ['Còn hàng', CHECK, 'Đã bán'] },
      fPrice: { k: 'price', buckets: PRICE_BUCKETS, mul: 1e9 }, fLand: { k: 'land', buckets: LAND_BUCKETS, mul: 1 }
    };
    function buildOptions() { renderFilters(); }
    function renderFilters() {
      var f = state.filter;
      Object.keys(FIELDS).forEach(function (id) {
        var d = FIELDS[id], cur = f[d.k], pool = state.units.filter(function (u) { return matches(u, d.k); }), items = [];
        if (d.buckets) {
          items = d.buckets.map(function (b, i) { return { v: String(i), l: b[2], n: pool.filter(function (u) { return inBucket(u[d.k], b, d.mul); }).length }; });
        } else {
          var c = {}; pool.forEach(function (u) { if (u[d.k]) c[u[d.k]] = (c[u[d.k]] || 0) + 1; });
          var keys = d.order ? d.order.filter(function (x) { return c[x]; }) : Object.keys(c).sort(function (a, b) { return c[b] - c[a] || natural(a, b); });
          items = keys.map(function (x) { return { v: x, l: x, n: c[x] }; });
          // Ô Bàn giao: chèn lựa chọn ghép (ví dụ "Thô VOS") ngay sau lựa chọn bàn giao gốc.
          if (d.k === 'handover') combos().forEach(function (cb) {
            var n = pool.filter(function (u) { return comboMatch(u, cb); }).length;
            var at = items.map(function (it) { return it.v; }).indexOf(cb.handover);
            if (n || cur === cb.label) items.splice(at < 0 ? items.length : at + 1, 0, { v: cb.label, l: cb.label, n: n });
          });
        }
        var shown = items.filter(function (it) { return it.n > 0 || it.v === cur; });
        var el = $(id), lab = el.closest('label');
        el.innerHTML = '<option value="">Tất cả (' + pool.length + ')</option>' + shown.map(function (it) {
          return '<option value="' + esc(it.v) + '"' + (it.v === cur ? ' selected' : '') + '>' + esc(it.l) + ' (' + it.n + ')</option>';
        }).join('');
        el.value = cur || '';
        // Ô có hiện hay không tính theo toàn bộ dự án, để các ô không nhảy vị trí khi đang lọc.
        var all = d.buckets ? d.buckets.filter(function (b) { return state.units.some(function (u) { return inBucket(u[d.k], b, d.mul); }); }).length
          : state.units.map(function (u) { return u[d.k]; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).length;
        lab.hidden = !cur && (all < 2 || (!d.buckets && coverage(d.k) < 0.3));
        lab.classList.toggle('set', !!cur);
      });
      // Số cột theo số ô đang hiện: 5–6 ô xếp 3 cột, 7–8 ô xếp 4 cột (máy tính); điện thoại luôn 2 cột.
      var nv = Array.prototype.filter.call($('adv').querySelectorAll('.fld'), function (l) { return !l.hidden; }).length;
      $('adv').style.setProperty('--cols', nv <= 4 ? Math.max(nv, 1) : (nv <= 6 ? 3 : 4));
    }
    Object.keys(FIELDS).forEach(function (id) { $(id).onchange = function () { state.filter[FIELDS[id].k] = this.value; reset(); }; });
    var qt; $('q').oninput = function () { var v = this.value; clearTimeout(qt); qt = setTimeout(function () { state.filter.q = v; reset(); }, 150); };
    // Phần lọc chỉ hiện khi bấm "Lọc thêm".
    $('advBtn').onclick = function () {
      var open = $('adv').hidden;
      $('adv').hidden = !open;
      this.classList.toggle('on', open); this.setAttribute('aria-expanded', String(open));
    };
    $('sortSel').onchange = function () { var v = this.value; state.sort = v === 'default' ? { key: 'default', dir: 1 } : { key: v.split(':')[0], dir: Number(v.split(':')[1]) }; reset(); };
    function clearFilters() { state.filter = blank(); $('q').value = ''; reset(); }
    $('clearAll').onclick = clearFilters;
    $('moreBtn').onclick = function () { state.shown += C.pageSize; render(); };
    function reset() { state.shown = C.pageSize; render(); }
    function advCount() { var f = state.filter; return ['handover', 'type', 'price', 'land', 'status', 'zone', 'direction'].filter(function (k) { return f[k]; }).length; }
    function anyFilter() { return !!(state.filter.q || advCount()); }

    function matches(u, skip) {
      var f = state.filter, q = norm(f.q).trim();
      if (skip !== 'tab' && f.dq && !u.dq) return false;
      if (skip !== 'tab' && f.saved && !isSaved(u)) return false;
      for (var id in FIELDS) {
        var d = FIELDS[id], v = f[d.k];
        if (!v || skip === d.k) continue;
        if (d.buckets) { if (!inBucket(u[d.k], d.buckets[+v], d.mul)) return false; }
        else if (d.k === 'handover' && comboByLabel(v)) { if (!comboMatch(u, comboByLabel(v))) return false; }
        else if (u[d.k] !== v) return false;
      }
      if (q && q.split(/\s+/).some(function (w) { return norm([u.code, u.zone, u.street, u.type, u.direction, u.handover].join(' ')).indexOf(w) < 0; })) return false;
      return true;
    }

    function combos() { return (C.handoverCombos || []).filter(function (cb) { return cb && cb.label && cb.handover && cb.tag; }); }
    function comboByLabel(v) { return combos().filter(function (cb) { return cb.label === v; })[0]; }
    function comboMatch(u, cb) { return norm(u.handover) === norm(cb.handover) && (u.tags || []).indexOf(cb.tag) >= 0; }
    function dqCfg() { return state.data && state.data.exclusiveTab; }
    function renderTabs() {
      var cfg = dqCfg(), ndq = state.units.filter(function (u) { return u.dq; }).length;
      var nsaved = 0; // đã bỏ nút Quan tâm
      var showDq = !!cfg && ndq > 0;
      if (!showDq) state.filter.dq = '';
      if (!nsaved) state.filter.saved = '';
      $('gtabs').hidden = !showDq && !nsaved;
      if ($('gtabs').hidden) return;
      var cur = state.filter.saved ? 'saved' : state.filter.dq ? 'dq' : '';
      var base = state.units.filter(function (u) { return matches(u, 'tab'); });
      var b = function (v, inner) { return '<button role="tab" data-tab="' + v + '"' + (cur === v ? ' class="on"' : '') + ' aria-selected="' + (cur === v) + '">' + inner + '</button>'; };
      $('gtabs').innerHTML = b('', 'Tất cả căn <b>' + base.length + '</b>') +
        (showDq ? b('dq', '<span class="dqmark">' + esc(cfg.short || 'ĐQ') + '</span>' + esc((cfg.label || '').replace(new RegExp('^' + (cfg.short || 'ĐQ') + '\\s*'), '')) + ' <b>' + base.filter(function (u) { return u.dq; }).length + '</b>') : '') +
        (nsaved ? b('saved', '<span style="color:var(--brand);display:inline-flex;width:15px">' + ICON.heart + '</span>Đã lưu <b>' + base.filter(isSaved).length + '</b>') : '');
    }
    $('gtabs').onclick = function (e) { var b = e.target.closest('button[data-tab]'); if (!b) return; var t = b.dataset.tab; state.filter.dq = t === 'dq' ? '1' : ''; state.filter.saved = t === 'saved' ? '1' : ''; updateHash(); reset(); };
    function dqTag(u) {
      var c = dqCfg(), titles = (state.data && state.data.tagTitles) || {};
      // Nhãn ĐQ (giỏ độc quyền) và các nhãn danh sách khác, ví dụ VOS (căn thuộc Quỹ VOS).
      return (u.dq && c ? '<span class="dq" title="' + esc(c.title || '') + '">' + esc(c.short || 'ĐQ') + '</span>' : '') +
        (u.tags || []).map(function (t) { return '<span class="dq tg" title="' + esc(titles[t] || t) + '">' + esc(t) + '</span>'; }).join('');
    }
    function renderChips() { renderTabs(); renderFilters(); }

    // ─── Bảng ───
    var COLS = [
      { k: 'code', l: 'Mã căn', cell: function (u) { return '<span class="code">' + esc(u.code) + '</span>' + dqTag(u); } },
      { k: 'price', l: 'Giá niêm yết', title: 'Đã gồm VAT và kinh phí bảo trì', cell: function (u) { return '<span class="price">' + ty(u.price) + '</span>' + (perM2(u) ? '<span class="unitp">' + trieu(perM2(u)) + '</span>' : ''); } },
      { k: 'type', l: 'Loại hình', cell: function (u) { return esc(u.type) || '<span class="dim">-</span>'; } },
      { k: 'land', l: 'DT đất', num: 1, cell: function (u) { return u.land != null ? m2(u.land) + '<span class="m2">m²</span>' : '<span class="dim">-</span>'; } },
      { k: 'build', l: 'DT xây dựng', num: 1, cell: function (u) { return u.build != null ? m2(u.build) + '<span class="m2">m²</span>' : '<span class="dim">-</span>'; } },
      { k: 'direction', l: 'Hướng', cell: function (u) { return esc(u.direction) || '<span class="dim">-</span>'; } },
      { k: 'handover', l: 'Bàn giao', cell: function (u) { return esc(u.handover) || '<span class="dim">-</span>'; } },
      { k: 'zone', l: 'Phân khu', cell: function (u) { return esc(u.zone) || '<span class="dim">-</span>'; } },
      { k: 'status', l: 'Tình trạng', cell: function (u) { return '<span class="stt ' + stCls(u.status) + '">' + esc(u.status) + '</span>'; } }
    ];
    function cols() {
      return COLS.filter(function (c) {
        if (['code', 'price', 'status'].indexOf(c.k) >= 0) return true;
        return coverage(c.k) >= 0.3;
      });
    }
    function sortRows(rows) {
      var s = state.sort;
      return rows.slice().sort(function (a, b) {
        if (s.key === 'default') return rank(a.status) - rank(b.status) || (a.price || Infinity) - (b.price || Infinity) || natural(a.code, b.code);
        var x = s.key === 'perM2' ? perM2(a) : a[s.key], y = s.key === 'perM2' ? perM2(b) : b[s.key], r;
        if (s.key === 'status') r = rank(a.status) - rank(b.status);
        else if (typeof x === 'number' || typeof y === 'number') { r = (x == null ? Infinity : x) - (y == null ? Infinity : y); if (isNaN(r)) r = 0; }
        else r = natural(x || '', y || '');
        return (r || natural(a.code, b.code)) * s.dir;
      });
    }

    function render() {
      renderChips();
      var rows = sortRows(state.units.filter(function (u) { return matches(u); }));
      var n = advCount(); $('advCount').hidden = !n; $('advCount').textContent = n;
      var sv = state.sort.key === 'default' ? 'default' : state.sort.key + ':' + state.sort.dir;
      $('sortSel').value = Array.prototype.some.call($('sortSel').options, function (o) { return o.value === sv && !o.hidden; }) ? sv : 'custom';
      var shown = rows.slice(0, state.shown);
      state.visible = rows;
      $('resText').innerHTML = rows.length
        ? 'Hiển thị <b>' + shown.length + '</b> / <b>' + rows.length + '</b> căn' + (rows.length !== state.units.length ? ' phù hợp' : '')
        : 'Không có căn phù hợp';
      $('clearAll').hidden = !anyFilter();
      var cs = cols();
      $('thead').innerHTML = '<tr>' + cs.map(function (c) {
        var on = state.sort.key === c.k;
        return '<th data-k="' + c.k + '" class="col-' + c.k + (c.num ? ' num' : '') + '"' + (c.title ? ' title="' + esc(c.title) + '"' : '') + '>' +
          esc(c.l) + '<span class="si">' + (on ? (state.sort.dir > 0 ? '↑' : '↓') : '') + '</span></th>';
      }).join('') + '<th class="go" aria-hidden="true"></th></tr>';
      if (!rows.length) {
        var msg = '<div class="empty">Không có căn phù hợp. Thử bỏ bớt bộ lọc, hoặc gọi <b>' + esc(C.hotlineText) + '</b> để được gợi ý căn tương tự.</div>';
        $('tbody').innerHTML = '<tr><td colspan="' + (cs.length + 1) + '">' + msg + '</td></tr>'; $('cards').innerHTML = msg; $('more').hidden = true; return;
      }
      $('tbody').innerHTML = shown.map(function (u) {
        return '<tr data-code="' + esc(u.code) + '" tabindex="0">' + cs.map(function (c) { return '<td class="col-' + c.k + (c.num ? ' num' : '') + '">' + c.cell(u) + '</td>'; }).join('') + '<td class="go">›</td></tr>';
      }).join('');
      $('cards').innerHTML = shown.map(function (u) {
        var facts = [['Loại hình', u.type], ['Hướng', u.direction], ['Diện tích đất', u.land != null ? m2(u.land) + ' m²' : ''], ['Xây dựng', u.build != null ? m2(u.build) + ' m²' : ''],
          ['Bàn giao', u.handover], ['Phân khu', u.zone]].filter(function (x) { return x[1]; });
        return '<div class="card" data-code="' + esc(u.code) + '"><div class="r1"><span><span class="code">' + esc(u.code) + '</span>' + dqTag(u) + '</span><span class="stt ' + stCls(u.status) + '">' + esc(u.status) + '</span></div>' +
          '<div class="r2"><span class="price">' + ty(u.price) + '</span>' + (perM2(u) ? '<span class="unitp">' + trieu(perM2(u)) + '</span>' : '') + '</div>' +
          '<div class="facts">' + facts.map(function (x) { return '<div><span>' + x[0] + '</span>' + esc(x[1]) + '</div>'; }).join('') + '</div></div>';
      }).join('');
      var left = rows.length - shown.length;
      $('more').hidden = left <= 0;
      $('moreBtn').textContent = 'Xem thêm ' + Math.min(left, C.pageSize) + ' căn (còn ' + left + ')';
    }
    $('thead').onclick = function (e) {
      var th = e.target.closest('th[data-k]'); if (!th) return;
      var k = th.dataset.k;
      state.sort = { key: k, dir: state.sort.key === k ? -state.sort.dir : (k === 'land' || k === 'build' ? -1 : 1) }; reset();
    };
    function rowOpen(e) { var el = e.target.closest('[data-code]'); if (!el) return; var u = findCode(el.dataset.code); if (u) openUnit(u); }
    $('tbody').onclick = $('cards').onclick = rowOpen;
    $('tbody').onkeydown = function (e) { if (e.key === 'Enter') rowOpen(e); };
    function findCode(c) { var n = norm(c).replace(/\s/g, ''); return state.units.filter(function (u) { return norm(u.code).replace(/\s/g, '') === n; })[0]; }

    // ─── Chi tiết căn ───
    var ICON = {
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
      compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
      area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>',
      heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.3h2c.7-1.2 2.2-2.3 4.3-2.3 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>',
      share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
      chat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.9 2 11.6c0 2.4 1.2 4.6 3.1 6.1L4.5 21l3.8-1.9c1.2.4 2.4.6 3.7.6 5.5 0 10-3.9 10-8.6S17.5 3 12 3zm-4 9.6a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .7-.2 1z"/></svg>'
    };
    // Ảnh chỉ căn: link ảnh trực tiếp, hoặc file Google Drive (xem trước nếu file chia sẻ công khai).
    function unitImage(u) {
      var l = u.unitLink || '';
      if (/\.(webp|jpe?g|png|gif)(\?|$)/i.test(l)) return l;
      var m = l.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]{20,})/);
      return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1400' : '';
    }
    function posterHtml(u) {
      return '<div class="poster"><div class="brand"><b>' + esc(C.brandName) + '</b><span>' + esc(state.project.name) + '</span></div>' +
        '<div><div class="mc">Mã căn</div><div class="code2">' + esc(u.code) + '</div></div>' +
        '<div class="pfacts"><div><span>DT đất</span><b>' + (u.land != null ? m2(u.land) + ' m²' : '-') + '</b></div><div><span>DT xây dựng</span><b>' + (u.build != null ? m2(u.build) + ' m²' : '-') + '</b></div>' +
        '<div><span>Loại hình</span><b>' + esc(u.type || '-') + '</b></div></div>' +
        '<div class="pnote">' + esc([u.zone, u.street ? 'Dãy ' + u.street : '', u.handover ? 'Bàn giao ' + lowerVi(u.handover) : ''].filter(Boolean).join(' · ')) +
        (u.unitLink ? ' · <a href="' + esc(u.unitLink) + '" target="_blank" rel="noopener">Xem ảnh chỉ căn ↗</a>' : '') + '</div></div>';
    }
    // Danh sách căn quan tâm, lưu trong trình duyệt
    var SAVED_KEY = 'adl_bang_hang_luu';
    function savedSet() { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch (e) { return []; } }
    function isSaved(u) { return savedSet().indexOf(state.project.id + '|' + u.code) >= 0; }
    function toggleSaved(u) {
      var list = savedSet(), k = state.project.id + '|' + u.code, i = list.indexOf(k);
      if (i >= 0) list.splice(i, 1); else list.push(k);
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch (e) { /* bỏ qua */ }
      return i < 0;
    }
    function contacts() {
      var list = C.contacts && C.contacts.length ? C.contacts : [{ name: C.brandName, role: 'Tư vấn dự án ' + state.project.name, phone: C.hotline, phoneText: C.hotlineText, zalo: C.zalo }];
      return list.map(function (p) {
        var ini = String(p.name || '').split(/\s+/).filter(Boolean).slice(-2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
        return '<div class="person"><div class="ava">' + (p.avatar ? '<img src="' + esc(p.avatar) + '" alt="">' : esc(ini)) + '</div><div class="nm"><b>' + esc(p.name) + '</b><span>' + esc(p.role || '') +
          (p.phoneText ? ' · ' + esc(p.phoneText) : '') + '</span><div class="cbtn">' +
          (p.phone ? '<a class="ph" href="tel:' + esc(p.phone) + '" title="Gọi ' + esc(p.phoneText || p.phone) + '" aria-label="Gọi">' + ICON.phone + '</a>' : '') +
          (p.zalo ? '<a class="zl" href="' + esc(p.zalo) + '" target="_blank" rel="noopener" title="Nhắn Zalo" aria-label="Nhắn Zalo" data-zalo="1">' + ICON.chat + '</a>' : '') + '</div></div></div>';
      }).join('');
    }
    function loanCalc(u) {
      var price = u.priceLoan || u.price || 0;
      return '<div class="loan" id="mLoan" hidden><div class="in">' +
        '<label>Tỷ lệ vay<select id="lPct">' + [50, 60, 65, 70, 80].map(function (v) { return '<option value="' + v + '"' + (v === 70 ? ' selected' : '') + '>' + v + '%</option>'; }).join('') + '</select></label>' +
        '<label>Thời hạn<select id="lYears">' + [10, 15, 20, 25, 30].map(function (v) { return '<option value="' + v + '"' + (v === 25 ? ' selected' : '') + '>' + v + ' năm</option>'; }).join('') + '</select></label>' +
        '<label>Lãi suất (%/năm)<input id="lRate" type="number" min="0" max="30" step="0.1" value="9"></label></div>' +
        '<div class="out"><div><span>Số tiền vay</span><b id="lAmt"></b></div><div><span>Trả đều mỗi tháng</span><b id="lMon"></b></div><div><span>Tháng đầu (dư nợ giảm dần)</span><b id="lFirst"></b></div></div>' +
        '<p>Tính trên ' + (u.priceLoan ? 'giá vay' : 'giá niêm yết') + ' ' + ty(price) + '. Kết quả ước tính để tham khảo; lãi suất, ân hạn và hỗ trợ lãi suất theo chính sách chủ đầu tư và ngân hàng tại thời điểm vay.</p></div>';
    }
    function updateLoan(u) {
      var price = u.priceLoan || u.price || 0, pct = +$('lPct').value / 100, n = +$('lYears').value * 12, r = (+$('lRate').value || 0) / 100 / 12;
      var P = price * pct, mon = r ? P * r / (1 - Math.pow(1 + r, -n)) : P / n, first = P / n + P * r;
      $('lAmt').textContent = ty(P); $('lMon').textContent = num(mon / 1e6, 1) + ' triệu'; $('lFirst').textContent = num(first / 1e6, 1) + ' triệu';
    }

    function openUnit(u) {
      state.current = u; updateHash();
      var upd = when(state.data.updatedAt);
      $('mTitle').innerHTML = esc(u.code) + dqTag(u);
      $('mSub').textContent = state.project.name + (u.zone ? ' · ' + u.zone : '');
      $('mPrice').innerHTML = '<div class="row"><span class="k">Giá NY:</span><span class="v">' + ty(u.price) + '</span></div><div class="k2">(Gồm VAT và kinh phí bảo trì)</div>';
      // Cột trái: ảnh, thông tin nhanh, thao tác
      var img = unitImage(u);
      $('mLeft').innerHTML = '<div class="media' + (img ? ' has-img loading' : ' no-img') + '" id="mMedia">' + (img ? '<img id="mImg" src="' + esc(img) + '" alt="Ảnh chỉ căn ' + esc(u.code) + '">' +
          '<div class="mtools"><button id="mZoom" type="button">Phóng to</button></div><span class="hint">Bấm vào ảnh để xem toàn màn hình</span>' : posterHtml(u)) + '</div>' +
        '<div class="quick"><div><span>' + ICON.home + 'Loại hình</span><b>' + esc(u.type || '-') + '</b></div>' +
          (u.direction || !u.handover ? '<div><span>' + ICON.compass + 'Hướng</span><b>' + esc(u.direction || '-') + '</b></div>' : '<div><span>' + ICON.home + 'Bàn giao</span><b>' + esc(u.handover) + '</b></div>') +
        '<div><span>' + ICON.area + 'Diện tích</span><b>' + (u.land != null ? m2(u.land) + 'm²' : '-') + '</b></div></div>' +
        '<div class="acts"><button class="act" id="mShare">' + ICON.share + 'Chia sẻ</button><button class="act send" id="mSend">' + ICON.chat + 'Gửi thông tin</button></div>';
      var im = $('mImg');
      if (im) {
        var showZoom = function () { openZoom(img, u.code, u.unitLink || img); };
        im.onload = function () { im.classList.add('ok'); $('mMedia').classList.remove('loading'); };
        im.onerror = function () { var m = $('mMedia'); m.className = 'media no-img'; m.innerHTML = posterHtml(u); };
        $('mMedia').onclick = function (e) { if (!e.target.closest('a')) showZoom(); };
      }
      // Cột phải: các mục thông tin
      function lk(url, label, id) { return url ? '<a class="lk" href="' + esc(url) + '" target="_blank" rel="noopener">' + label + '<span class="ar">↗</span></a>' : (id ? '<button class="lk" id="' + id + '">' + label + '</button>' : ''); }
      function tile(k, v, cls) { return v ? '<div class="tile' + (cls ? ' ' + cls : '') + '"><span>' + k + '</span><b>' + v + '</b></div>' : ''; }
      function tiles(html, max) { var n = (html.match(/class="tile/g) || []).length, c = n <= max ? n : (n === 4 ? 2 : max); return '<div class="tiles" style="--n:' + Math.max(c, 1) + '">' + html + '</div>'; }
      var fundCls = /^s/i.test(norm(u.fund)) ? 'so' : 'thu';
      $('mRight').innerHTML =
        '<div class="blk"><div class="bh"><h4>Giá</h4><div class="tools2">' + lk(u.ptg, 'Phiếu tính giá') + '<button class="lk" id="mLoanBtn">Tính lãi vay</button></div></div>' +
          tiles(tile('Giá niêm yết', u.price ? ty(u.price) : 'Liên hệ', 'hl') + tile('Giá TTTĐ', u.priceProgress ? ty(u.priceProgress) : '') +
          tile('Giá TTS', u.priceEarly ? ty(u.priceEarly) : '') + tile('Giá vay', u.priceLoan ? ty(u.priceLoan) : '') +
          tile('Giá chưa VAT', u.priceExVat ? ty(u.priceExVat) : '') + tile('Đơn giá', perM2(u) ? num(perM2(u) / 1e6, 1) + ' <small>triệu/m²</small>' : ''), 3) +
          '<p class="tnote">Giá niêm yết gồm VAT và kinh phí bảo trì.</p>' + loanCalc(u) + '</div>' +
        '<div class="blk"><div class="bh"><h4>Thông tin căn</h4><div class="tools2">' + lk(u.unitLink, 'Chỉ căn') + '</div></div>' +
          tiles(tile('DT đất', u.land != null ? m2(u.land) + ' <small>m²</small>' : '') + tile('DT xây dựng', u.build != null ? m2(u.build) + ' <small>m²</small>' : '') +
          tile('Bàn giao', esc(u.handover)) + tile('Quỹ căn', u.fund ? '<i class="fund ' + fundCls + '">' + esc(u.fund) + '</i>' : '') + tile('Phân khu', esc(u.zone)), 5) + '</div>' +
        '<div class="blk"><div class="bh"><h4>Trạng thái</h4><span class="stt ' + stCls(u.status) + '">' + esc(u.status) + '</span></div>' +
          '<p class="upd">Cập nhật lúc <b>' + esc(upd) + '</b></p><div class="people">' + contacts() + '</div>' +
          '<div class="mfoot">' + (projectLink() ? lk(projectLink(), 'Thông tin dự án') : '') +
          '<p class="legal">Giá tham khảo theo bảng hàng cập nhật lúc ' + esc(upd) + '. Giá và chính sách có thể thay đổi theo xác nhận của chủ đầu tư.</p></div></div>';
      var info = 'Căn ' + u.code + ', ' + state.project.name + '\n' + 'Giá niêm yết: ' + ty(u.price) + ' (gồm VAT và KPBT)' +
        (u.land != null ? '\nDiện tích đất: ' + m2(u.land) + ' m²' : '') + (u.build != null ? ', xây dựng: ' + m2(u.build) + ' m²' : '') +
        (u.type ? '\nLoại hình: ' + u.type : '') + (u.handover ? ', bàn giao: ' + u.handover : '') + (u.direction ? '\nHướng: ' + u.direction : '') +
        (u.priceLoan ? '\nGiá vay: ' + ty(u.priceLoan) : '') + (u.priceProgress ? '\nGiá TTTĐ: ' + ty(u.priceProgress) : '') + (u.priceEarly ? '\nGiá TTS: ' + ty(u.priceEarly) : '') +
        (u.fund ? '\nQuỹ căn: ' + u.fund : '') + (u.tags && u.tags.length ? '\nThuộc quỹ: ' + u.tags.join(', ') : '') + (u.ptg ? '\nPhiếu tính giá: ' + u.ptg : '') + '\nTình trạng: ' + u.status + (projectLink() ? '\nThông tin dự án: ' + projectLink() : '');
      var ask = function () { copy('Tôi muốn tìm hiểu căn ' + u.code + ' dự án ' + state.project.name + ' (giá niêm yết ' + ty(u.price) + ').', 'Đã sao chép tin nhắn, dán vào Zalo để gửi'); window.open(C.zalo, '_blank', 'noopener'); };
      Array.prototype.forEach.call($('mRight').querySelectorAll('a[data-zalo]'), function (a) { a.onclick = function (e) { e.preventDefault(); track('zalo', u); ask(); }; });
      // Chia sẻ: gửi link căn. Gửi thông tin: gửi đầy đủ thông tin căn (kèm link).
      $('mShare').onclick = function () {
        track('chia_se', u);
        if (navigator.share) navigator.share({ title: 'Căn ' + u.code + ' ' + state.project.name, url: location.href }).catch(function () {});
        else copy(location.href, 'Đã sao chép link căn');
      };
      $('mSend').onclick = function () {
        track('gui_thong_tin', u);
        var text = info + '\nXem căn: ' + location.href;
        if (navigator.share) navigator.share({ title: 'Căn ' + u.code + ' ' + state.project.name, text: text }).catch(function () {});
        else copy(text, 'Đã sao chép thông tin căn, dán vào Zalo hoặc Messenger để gửi');
      };
      Array.prototype.forEach.call($('mRight').querySelectorAll('a.ph'), function (a) { a.addEventListener('click', function () { track('goi', u); }); });
      Array.prototype.forEach.call($('mRight').querySelectorAll('a.lk'), function (a) { a.addEventListener('click', function () { track(a.href === u.ptg ? 'phieu_tinh_gia' : a.href === u.unitLink ? 'chi_can' : 'thong_tin_du_an', u); }); });
      $('mLoanBtn').onclick = function () { var b = $('mLoan'); b.hidden = !b.hidden; this.classList.toggle('on', !b.hidden); if (!b.hidden) updateLoan(u); };
      ['lPct', 'lYears', 'lRate'].forEach(function (id) { $(id).oninput = $(id).onchange = function () { updateLoan(u); }; });
      var list = state.visible || [], i = list.indexOf(u);
      $('mPrev').disabled = i <= 0; $('mNext').disabled = i < 0 || i >= list.length - 1;
      track('xem_can', u);
      $('modal').classList.add('open'); $('mClose').focus();
    }
    function openZoom(src, title, orig) {
      $('zImg').src = src; $('zImg').alt = title; $('zTitle').textContent = title;
      $('zOrig').href = orig || src; $('zoom').classList.add('open'); $('zoom').scrollTop = 0;
    }
    function closeZoom() { $('zoom').classList.remove('open'); }
    $('zClose').onclick = closeZoom;
    $('zoom').onclick = function (e) { if (e.target === $('zoom')) closeZoom(); };
    $('mPrev').onclick = function () { var l = state.visible || [], i = l.indexOf(state.current); if (i > 0) openUnit(l[i - 1]); };
    $('mNext').onclick = function () { var l = state.visible || [], i = l.indexOf(state.current); if (i >= 0 && i < l.length - 1) openUnit(l[i + 1]); };
    function closeModal() { $('modal').classList.remove('open'); state.current = null; updateHash(); }
    $('mClose').onclick = closeModal;
    $('modal').onclick = function (e) { if (e.target === $('modal')) closeModal(); };
    document.addEventListener('keydown', function (e) {
      if ($('zoom').classList.contains('open')) { if (e.key === 'Escape') closeZoom(); return; }
      if (!$('modal').classList.contains('open')) return;
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowLeft') $('mPrev').click();
      else if (e.key === 'ArrowRight') $('mNext').click();
    });
    // Đo lường: đẩy sự kiện vào dataLayer (Google Tag Manager / GA4) nếu website có cài.
    function track(action, u) {
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'adl_bang_hang', adl_action: action, adl_project: state.project && state.project.id, adl_unit: u ? u.code : undefined, adl_price: u ? u.price : undefined });
      } catch (e) { /* bỏ qua */ }
    }
    function copy(t, msg) {
      var ok = function () { toast(msg); };
      var fb = function () { var a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); ok(); } catch (e) { /* bỏ qua */ } a.remove(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb); else fb();
    }
    function updateHash() {
      if (!useHash) return;
      var p = new URLSearchParams();
      if (state.project && !lockProject) p.set('du-an', state.project.id);
      if (state.filter.dq) p.set('gio', 'dq');
      if (curTab && curTab !== (C.defaultTab || 'quy-can')) p.set('muc', curTab);
      if (state.current) p.set('can', state.current.code);
      var h = p.toString();
      try { history.replaceState(null, '', location.pathname + location.search + (h ? '#' + h : '')); } catch (e) { /* bỏ qua */ }
    }

    var isDemo = new URLSearchParams(location.search).get('demo') === '1';
    var local = isDemo ? null : readLocal();
    if (local) {
      try { apply(local, false); } catch (e) { local = null; }
      load(!!local, true); // hiện bảng đã nhớ ngay, đồng thời lấy bản mới và cập nhật lặng lẽ
    } else load(false);
    if (C.refreshSeconds) setInterval(function () { if (!document.hidden && !$('modal').classList.contains('open')) load(true, true); }, C.refreshSeconds * 1000);
  }

  // Dữ liệu minh họa: chỉ khi trang mở với ?demo=1 (để thử giao diện, không phải bảng hàng thật).
  function demoData() {
    var dirs = ['Đông Bắc', 'Tây Bắc', 'Tây', 'Tây Nam', 'Đông Nam', '–'], st = ['Còn hàng', 'Còn hàng', 'Đang giữ chỗ', 'Còn hàng', 'Liên hệ', 'Đang giữ chỗ'];
    function gen(defs) {
      var out = [];
      defs.forEach(function (d) {
        for (var i = 1; i <= d[4]; i++) {
          var land = d[3] + (i % 3) * 5;
          out.push({ code: d[1] + '-' + ('0' + i * 2).slice(-2), zone: d[0], street: d[1], type: d[2], direction: dirs[(i + d[1].length) % 6], handover: i % 2 ? 'GIÃN XÂY' : 'Thô',
            land: land, build: Math.round(land * 2.7 * 10) / 10, price: Math.round((d[5] + (i % 5) * 0.21e9) / 1e7) * 1e7, status: st[(i * 5 + d[1].length) % 6],
            ptg: i % 4 ? 'https://drive.google.com/drive/folders/minh-hoa' : '', dq: d[6] ? 1 : 0, priceExVat: Math.round((d[5] + (i % 5) * 0.21e9) / 1.1 / 1e6) * 1e6, priceLoan: Math.round((d[5] + (i % 5) * 0.21e9) * 1.03 / 1e7) * 1e7, priceProgress: d[5] + (i % 5) * 0.21e9, priceEarly: Math.round((d[5] + (i % 5) * 0.21e9) * 0.965 / 1e7) * 1e7, fund: i % 3 ? 'Thứ cấp' : 'Sơ cấp', tags: i % 5 === 1 ? ['VOS'] : [] });
        }
      });
      return out;
    }
    return { ok: true, updatedAt: new Date().toISOString(), tagTitles: { VOS: 'Căn thuộc Quỹ VOS' }, exclusiveTab: { enabled: true, short: 'ĐQ', label: 'ĐQ Á Đông Land', title: 'Giỏ hàng độc quyền Á Đông Land' }, projects: [
      { id: 'VHSGP', name: 'Vinhomes Saigon Park', units: gen([['', 'AS76', 'LK', 50, 14, 5.8e9, 1], ['', 'TL12A', 'Liền kề', 50, 12, 5.9e9], ['', 'AS85', 'LK (GÓC)', 60, 8, 6.5e9], ['', 'ĐLCV2', 'SL', 112, 6, 17.2e9, 1], ['', 'AS60', 'Liền kề xẻ khe', 70, 10, 9.6e9]]) },
      { id: 'VHCG', name: 'Vinhomes Green Paradise', units: gen([['VỊNH NGỌC', 'AS24', 'SL', 280, 6, 31.2e9], ['VỊNH NGỌC', 'TĐX', 'SL', 180, 6, 45.1e9], ['VỊNH TIÊN', 'VT44', 'LK', 80, 8, 14.9e9]]) }
    ] };
  }

  function init() { Array.prototype.forEach.call(document.querySelectorAll('[data-adl-bang-hang]'), mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.ADLBangHang = { mount: mount, refresh: init };
})();
