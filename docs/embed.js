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
    pageSize: 50
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
.stats { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px; }
.stat { background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.14); border-radius: 12px; padding: 12px 14px; }
.stat .k { font-size: 12px; color: rgba(255,255,255,.7); }
.stat .v { font-size: 20px; font-weight: 700; color: #fff; margin-top: 2px; white-space: nowrap; }
.stat .v small { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.7); }

/* Tab giỏ hàng (Tất cả / ĐQ) */
.gtabs { display: flex; gap: 4px; margin: 0 0 12px; border-bottom: 1px solid var(--line); }
.gtabs button { white-space: nowrap; border: 0; background: none; padding: 10px 16px 11px; font-size: 15px; font-weight: 600; color: var(--ink-2); border-bottom: 3px solid transparent; margin-bottom: -1px; display: inline-flex; align-items: center; gap: 8px; }
.gtabs button b { font-weight: 700; font-size: 12px; background: var(--other-bg); color: var(--other); border-radius: 999px; padding: 1px 8px; }
.gtabs button.on { color: var(--navy); border-bottom-color: var(--brand); }
.gtabs button.on b { background: var(--brand); color: #fff; }
.gtabs .dqmark { background: linear-gradient(135deg, #f0b429, #d98c00); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: .5px; padding: 2px 7px; border-radius: 5px; }
.dq { display: inline-block; vertical-align: 1px; margin-left: 6px; background: linear-gradient(135deg, #f0b429, #d98c00); color: #fff; font-size: 10.5px; font-weight: 700; letter-spacing: .5px; padding: 2px 6px; border-radius: 4px; }

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
.groups { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.grp { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.grp .lb { width: 86px; flex: none; font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }
.chip { border: 1px solid #dfe4ec; background: #fff; color: var(--ink-2); border-radius: 999px; padding: 5px 12px; font-size: 13px; line-height: 1.4; display: inline-flex; align-items: center; gap: 6px; }
.chip:hover { border-color: var(--navy-2); color: var(--navy); }
.chip.on { background: var(--navy); border-color: var(--navy); color: #fff; }
.chip b { font-weight: 700; }
.chip .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c, var(--muted)); }
.chip.on .dot { background: #fff; }
.adv { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line); }
.adv label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .3px; }
.adv select, .adv input { height: 38px; padding: 0 10px; border: 1px solid #dfe4ec; border-radius: 8px; background: #fff; font-size: 14px; font-weight: 400; color: var(--ink); text-transform: none; letter-spacing: 0; width: 100%; min-width: 0; }
.range { display: flex; gap: 6px; }

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

/* Chi tiết căn */
.mbg { position: fixed; inset: 0; background: rgba(11,31,75,.45); display: none; align-items: center; justify-content: center; z-index: 2147483000; padding: 16px; }
.mbg.open { display: flex; }
.modal { background: #fff; border-radius: 18px; width: min(920px, 100%); max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,.25); overflow: hidden; }
.mh { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-bottom: 1px solid var(--line); }
.mh h3 { margin: 0; font-size: 24px; font-weight: 700; color: var(--navy); line-height: 1.2; letter-spacing: .2px; }
.mh .sub { color: var(--muted); font-size: 13px; margin-top: 2px; }
.mh .np { margin-left: auto; text-align: right; }
.mh .np .k { color: var(--muted); font-size: 12px; }
.mh .np .v { color: var(--brand); font-size: 26px; font-weight: 700; line-height: 1.1; }
.mh .np .k2 { color: var(--muted); font-size: 11.5px; }
.close { background: var(--bg); border: 0; width: 36px; height: 36px; border-radius: 50%; color: var(--ink-2); font-size: 20px; line-height: 36px; padding: 0; flex: none; }
.close:hover { background: var(--line); }
.mb { padding: 16px 20px 18px; overflow: auto; }
.msec { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.sec { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }
.sec.wide { grid-column: 1 / -1; }
.sh { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.sh h4 { margin: 0; font-size: 16px; font-weight: 700; color: var(--navy); }
.lk { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #dfe4ec; background: #fff; border-radius: 8px; padding: 6px 11px; font-size: 13px; font-weight: 600; color: var(--navy); text-decoration: none; }
.lk:hover { border-color: var(--navy); }
.lk.main { background: var(--brand); border-color: var(--brand); color: #fff; }
.lk .ar { font-size: 12px; opacity: .8; }
.lk.off { color: #a8b0bd; border-style: dashed; cursor: default; }
.kv { display: grid; grid-template-columns: auto 1fr; gap: 7px 12px; font-size: 14px; }
.kv dt, .kv .k { color: var(--muted); }
.kv .v { text-align: right; font-weight: 600; color: var(--ink); white-space: nowrap; }
.kv .v.hl { color: var(--brand); font-weight: 700; }
.contact { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.contact .who { flex: 1; min-width: 180px; }
.contact .who b { display: block; color: var(--navy); font-size: 15px; }
.contact .who span { color: var(--muted); font-size: 13px; }
.mf { display: flex; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--line); background: #fbfcfe; align-items: center; flex-wrap: wrap; }
.btn { display: inline-flex; align-items: center; justify-content: center; text-align: center; border-radius: 10px; padding: 11px 16px; font-weight: 600; text-decoration: none; border: 1px solid #dfe4ec; background: #fff; color: var(--navy); }
.btn.primary { background: var(--brand); border-color: var(--brand); color: #fff; }
.btn.navy { background: var(--navy); border-color: var(--navy); color: #fff; }
.btn.sm { padding: 8px 12px; font-size: 13px; }
.mf .legal { margin: 0; flex: 1 1 260px; }
.toast { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); background: #1f2a3d; color: #fff; padding: 10px 16px; border-radius: 10px; z-index: 2147483001; display: none; font-size: 13.5px; }
.toast.show { display: block; }

/* Co theo bề rộng khung chứa của theme */
@container (max-width: 1100px) { .col-build { display: none; } }
@container (max-width: 980px) { .col-zone, .col-direction { display: none; } .stats { grid-template-columns: repeat(2, 1fr); } }
@container (max-width: 760px) {
  .w { padding: 4px 12px 32px; }
  .hero { padding: 20px 18px 18px; border-radius: 14px; }
  .hero h2 { font-size: 23px; }
  .stat .v { font-size: 17px; }
  .hero-top { gap: 12px; }
  .gtabs button { flex: 1 1 0; justify-content: center; padding: 10px 4px 11px; font-size: 14px; gap: 6px; min-width: 0; }
  .switch { width: 100%; flex-wrap: nowrap; } .switch button { flex: 1 1 0; min-width: 0; padding: 8px 6px; font-size: 12.5px; white-space: normal; line-height: 1.25; }
  .search { flex: 1 1 100%; }
  .sort { flex: 1 1 0; min-width: 0; } .sort span { display: none; } .sort select { min-width: 0; width: 100%; }
  .stat .k { font-size: 11.5px; }
  .grp { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; }
  .grp .lb { width: auto; margin-right: 4px; }
  .chip { white-space: nowrap; flex: none; }
  .adv { grid-template-columns: 1fr 1fr; }
  .tw { display: none; } .cards { display: block; }
  .msec { grid-template-columns: 1fr; }
  .mh { flex-wrap: wrap; padding: 14px 16px; }
  .mh .np { order: 5; width: 100%; text-align: left; margin-left: 0; display: flex; align-items: baseline; gap: 8px; }
  .mh .np .v { font-size: 22px; }
  #mPrev, #mNext { display: none; }
  .mh #mClose { margin-left: auto; }
  .mb { padding: 14px 16px; } .mf { padding: 12px 16px; } .mf .btn { flex: 1 1 140px; }
}
`;

  var HTML = `
<div class="w">
  <section class="hero" id="hero">
    <div class="hero-top">
      <div><p class="eyebrow">Bảng hàng</p><h2 id="hName">Đang tải bảng hàng</h2><p id="hSub">Bảng giá tham khảo do Á Đông Land tư vấn.</p><a class="plink" id="hLink" target="_blank" rel="noopener" hidden>Thông tin dự án <span>↗</span></a></div>
      <div class="switch" id="projects" role="tablist" aria-label="Chọn dự án"></div>
    </div>
    <div class="stats" id="stats"></div>
  </section>

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
    <div class="groups" id="groups" hidden>
      <div class="grp" id="gHandover"></div>
      <div class="grp" id="gPrice"></div>
      <div class="grp" id="gType"></div>
    </div>
    <div class="adv" id="adv" hidden>
      <label>Phân khu<select id="fZone"></select></label>
      <label>Hướng<select id="fDirection"></select></label>
      <label>Tình trạng<select id="fStatus"></select></label>
      <label>Diện tích đất từ (m²)<input id="fLand" type="number" min="0" step="5" placeholder="Ví dụ 80"></label>
      <label>Giá từ, đến (tỷ)<span class="range"><input id="fMin" type="number" min="0" step="0.5" placeholder="Từ"><input id="fMax" type="number" min="0" step="0.5" placeholder="Đến"></span></label>
    </div>
  </div>

  <div class="resbar"><span id="resText">Đang tải...</span><button class="link" id="clearAll" hidden>Xóa bộ lọc</button></div>
  <div class="tw"><table><thead id="thead"></thead><tbody id="tbody"></tbody></table></div>
  <div class="cards" id="cards"></div>
  <div class="more" id="more" hidden><button id="moreBtn"></button></div>
  <p class="legal" id="legal"></p>

  <div class="mbg" id="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="modal">
    <div class="mh">
      <button class="close" id="mPrev" aria-label="Căn trước">‹</button>
      <div><h3 id="mTitle"></h3><div class="sub" id="mSub"></div></div>
      <div class="np" id="mPrice"></div>
      <button class="close" id="mNext" aria-label="Căn sau">›</button>
      <button class="close" id="mClose" aria-label="Đóng">×</button>
    </div>
    <div class="mb" id="mBody"></div>
    <div class="mf" id="mFoot"></div>
  </div></div>
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
  function hashParams() { var h = new URLSearchParams(location.hash.replace(/^#/, '')); var q = new URLSearchParams(location.search); return { p: h.get('du-an') || q.get('p'), u: h.get('can') || q.get('u'), g: h.get('gio') }; }

  // ─── Chuẩn hóa cách ghi khác nhau giữa các sheet (LK / Liền kề, GIÃN XÂY / Giãn xây, "–"...) ───
  var EMPTY_MARKS = { '-': 1, '–': 1, '—': 1, '_': 1, '.': 1, 'n/a': 1, 'x': 1 };
  // Chuẩn hóa Unicode (NFC) và khoảng trắng: chữ gõ bằng hai kiểu mã hóa dấu khác nhau sẽ thành một.
  function blankish(v) { var t = String(v == null ? '' : v).normalize('NFC').replace(/[\s\u00a0\u200b]+/g, ' ').trim(); return EMPTY_MARKS[t.toLowerCase()] ? '' : t; }
  function cleanHandover(v) {
    var t = blankish(v); if (!t) return '';
    t = sentence(t).replace(/^bàn giao\s+/i, '').replace(/\s*[-–—]\s*/g, ' ').replace(/\s+/g, ' ').trim();
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
      priceExVat: u.priceExVat || null, priceLoan: u.priceLoan || null, dq: !!u.dq
    };
  }
  // Trạng thái hiển thị: gộp "Đang giữ chỗ" và "Liên hệ" thành "Check admin".
  var CHECK = 'Check admin';
  var STATUS_MERGE = { 'Đang giữ chỗ': CHECK, 'Liên hệ': CHECK };
  function viewStatus(s) { s = String(s || '').trim(); return STATUS_MERGE[s] || (s === 'Còn hàng' || s === 'Đã bán' ? s : CHECK); }
  function stCls(s) { return s === 'Còn hàng' ? 's-ok' : s === CHECK ? 's-hold' : s === 'Đã bán' ? 's-sold' : 's-other'; }
  function rank(s) { var r = { 'Còn hàng': 0, 'Check admin': 1, 'Đã bán': 3 }[s]; return r == null ? 2 : r; }
  var PRICE_BUCKETS = [[0, 7, 'Dưới 7 tỷ'], [7, 10, '7 – 10 tỷ'], [10, 15, '10 – 15 tỷ'], [15, 25, '15 – 25 tỷ'], [25, 40, '25 – 40 tỷ'], [40, 1e4, 'Trên 40 tỷ']];

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
    var $ = function (id) { return root.getElementById ? root.getElementById(id) : root.querySelector('#' + id); };
    var lockProject = host.getAttribute('data-du-an') || '';
    var useHash = host.getAttribute('data-lien-ket') !== '0';
    if (host.getAttribute('data-tieu-de') === '0') $('hero').hidden = true;
    var state = null;
    state = { data: null, projects: [], project: null, units: [], filter: blank(), sort: { key: 'default', dir: 1 }, current: null, shown: C.pageSize };
    function blank() { return { q: '', zone: '', type: '', direction: '', handover: '', land: '', min: '', max: '', status: '', dq: state && state.filter ? state.filter.dq : (host.getAttribute('data-gio') === 'dq' ? '1' : '') }; }
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
      if (changed && !keep) { state.filter = blank(); state.shown = C.pageSize; ['q', 'fMin', 'fMax', 'fLand'].forEach(function (x) { $(x).value = ''; }); }
      Array.prototype.forEach.call($('projects').children, function (b) { b.classList.toggle('on', b.dataset.p === id); b.setAttribute('aria-selected', String(b.dataset.p === id)); });
      var upd = when(state.data.updatedAt);
      $('hName').textContent = state.project.name;
      var pl = projectLink(); $('hLink').hidden = !pl; if (pl) { $('hLink').href = pl; $('hLink').title = 'Xem thông tin dự án ' + state.project.name; }
      $('hSub').textContent = (state.data.demo ? 'Dữ liệu minh họa. ' : '') + 'Bảng giá tham khảo do Á Đông Land tư vấn, cập nhật lúc ' + upd + '.';
      $('legal').textContent = 'Giá niêm yết đã gồm VAT và kinh phí bảo trì, theo bảng hàng cập nhật lúc ' + upd +
        '. Đơn giá tính bằng giá niêm yết chia diện tích đất. Giá và chính sách có thể thay đổi theo sản phẩm, thời điểm và xác nhận của chủ đầu tư.' +
        (state.project.incomplete ? ' Một phần giỏ hàng đang cập nhật, vui lòng gọi hotline để có danh sách đầy đủ.' : '');
      renderStats();
      host.dispatchEvent(new CustomEvent('adl:update', { bubbles: true, detail: { project: { id: state.project.id, name: state.project.name }, updatedAt: state.data.updatedAt, demo: !!state.data.demo } }));
      buildOptions(); render();
    }

    function projectLink() { var l = (C.projectLinks || {})[state.project && state.project.id]; return /^https:\/\//i.test(l || '') ? l : ''; }
    function renderStats() {
      var u = state.units, av = u.filter(function (x) { return x.status === 'Còn hàng'; });
      var prices = av.map(function (x) { return x.price; }).filter(Boolean);
      var pm = av.map(perM2).filter(Boolean);
      var lands = {}; u.forEach(function (x) { if (x.land) { var k = Math.round(x.land); lands[k] = (lands[k] || 0) + 1; } });
      var topLand = Object.keys(lands).sort(function (a, b) { return lands[b] - lands[a]; })[0];
      var items = [
        ['Căn còn hàng', av.length + ' <small>/ ' + u.length + ' căn</small>'],
        ['Giá từ', prices.length ? ty(Math.min.apply(null, prices)) : 'Liên hệ'],
        ['Đơn giá trung bình', pm.length ? num(pm.reduce(function (a, b) { return a + b; }, 0) / pm.length / 1e6, 1) + ' <small>triệu/m²</small>' : 'Liên hệ'],
        ['Diện tích đất phổ biến', topLand ? topLand + ' <small>m²</small>' : '-']
      ];
      $('stats').innerHTML = items.map(function (it) { return '<div class="stat"><div class="k">' + it[0] + '</div><div class="v">' + it[1] + '</div></div>'; }).join('');
    }

    // ─── Bộ lọc ───
    function opts(id, values, cur) {
      var u = values.filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort(natural);
      $(id).innerHTML = '<option value="">Tất cả</option>' + u.map(function (v) { return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('');
      $(id).closest('label').hidden = u.length < 2 || coverage(id === 'fZone' ? 'zone' : id === 'fDirection' ? 'direction' : 'status') < 0.3;
    }
    function coverage(k) { return state.units.length ? state.units.filter(function (u) { return u[k]; }).length / state.units.length : 0; }
    function buildOptions() {
      var u = state.units, f = state.filter;
      opts('fZone', u.map(function (x) { return x.zone; }), f.zone);
      opts('fDirection', u.map(function (x) { return x.direction; }), f.direction);
      // Tình trạng: giữ thứ tự Còn hàng, Check admin, Đã bán
      var sts = ['Còn hàng', CHECK, 'Đã bán'].filter(function (x) { return u.some(function (y) { return y.status === x; }); });
      $('fStatus').innerHTML = '<option value="">Tất cả</option>' + sts.map(function (v) { return '<option value="' + esc(v) + '"' + (v === f.status ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('');
      $('fStatus').closest('label').hidden = sts.length < 2;
    }
    var FMAP = { fZone: 'zone', fDirection: 'direction', fStatus: 'status' };
    Object.keys(FMAP).forEach(function (id) { $(id).onchange = function () { state.filter[FMAP[id]] = this.value; reset(); }; });
    ['fMin', 'fMax', 'fLand'].forEach(function (id) { $(id).oninput = function () { state.filter[{ fMin: 'min', fMax: 'max', fLand: 'land' }[id]] = this.value; reset(); }; });
    var qt; $('q').oninput = function () { var v = this.value; clearTimeout(qt); qt = setTimeout(function () { state.filter.q = v; reset(); }, 150); };
    // Toàn bộ phần lọc (nút Bàn giao, Khoảng giá, Loại hình và các ô lọc phụ) chỉ hiện khi bấm "Lọc thêm".
    $('advBtn').onclick = function () {
      var open = $('adv').hidden;
      $('adv').hidden = !open; $('groups').hidden = !open;
      this.classList.toggle('on', open); this.setAttribute('aria-expanded', String(open));
    };
    $('sortSel').onchange = function () { var v = this.value; state.sort = v === 'default' ? { key: 'default', dir: 1 } : { key: v.split(':')[0], dir: Number(v.split(':')[1]) }; reset(); };
    $('clearAll').onclick = function () { state.filter = blank(); ['q', 'fMin', 'fMax', 'fLand'].forEach(function (x) { $(x).value = ''; }); buildOptions(); reset(); };
    $('moreBtn').onclick = function () { state.shown += C.pageSize; render(); };
    function reset() { state.shown = C.pageSize; render(); }
    function advCount() { var f = state.filter; return ['zone', 'direction', 'status', 'land', 'handover', 'type'].filter(function (k) { return f[k]; }).length + (f.min || f.max ? 1 : 0); }
    function anyFilter() { var f = state.filter; return !!(f.q || f.handover || f.type || f.min || f.max || advCount()); }

    function matches(u, skip) {
      var f = state.filter, q = norm(f.q).trim();
      var min = f.min !== '' ? Number(f.min) * 1e9 : null, max = f.max !== '' ? Number(f.max) * 1e9 : null, land = f.land !== '' ? Number(f.land) : null;
      if (skip !== 'dq' && f.dq && !u.dq) return false;
      if (skip !== 'zone' && f.zone && u.zone !== f.zone) return false;
      if (skip !== 'type' && f.type && u.type !== f.type) return false;
      if (skip !== 'direction' && f.direction && u.direction !== f.direction) return false;
      if (skip !== 'handover' && f.handover && u.handover !== f.handover) return false;
      if (skip !== 'status' && f.status && u.status !== f.status) return false;
      if (land != null && !(u.land >= land)) return false;
      if (skip !== 'price' && min != null && !(u.price >= min)) return false;
      if (skip !== 'price' && max != null && !(u.price <= max)) return false;
      if (q && q.split(/\s+/).some(function (w) { return norm([u.code, u.zone, u.street, u.type, u.direction, u.handover].join(' ')).indexOf(w) < 0; })) return false;
      return true;
    }

    function chip(group, val, label, count, on, cls) {
      return '<button class="chip' + (on ? ' on' : '') + (cls ? ' ' + cls : '') + '" data-g="' + group + '" data-v="' + esc(val) + '"' + (count === 0 && !on ? ' disabled style="opacity:.45"' : '') + '>' +
        (cls ? '<span class="dot"></span>' : '') + esc(label) + (count != null ? ' <b>' + count + '</b>' : '') + '</button>';
    }
    function dqCfg() { return state.data && state.data.exclusiveTab; }
    function renderTabs() {
      var cfg = dqCfg(), n = state.units.filter(function (u) { return u.dq; }).length;
      var show = !!cfg && n > 0;
      $('gtabs').hidden = !show;
      if (!show) { state.filter.dq = ''; return; }
      var all = state.units.filter(function (u) { return matches(u, 'dq'); }).length;
      var dq = state.units.filter(function (u) { return u.dq && matches(u, 'dq'); }).length;
      $('gtabs').innerHTML = '<button role="tab" data-dq=""' + (state.filter.dq ? '' : ' class="on"') + ' aria-selected="' + !state.filter.dq + '">Tất cả căn <b>' + all + '</b></button>' +
        '<button role="tab" data-dq="1"' + (state.filter.dq ? ' class="on"' : '') + ' aria-selected="' + !!state.filter.dq + '" title="' + esc(cfg.title || '') + '"><span class="dqmark">' + esc(cfg.short || 'ĐQ') + '</span>' +
        esc((cfg.label || '').replace(new RegExp('^' + (cfg.short || 'ĐQ') + '\\s*'), '')) + ' <b>' + dq + '</b></button>';
    }
    $('gtabs').onclick = function (e) { var b = e.target.closest('button[data-dq]'); if (!b) return; state.filter.dq = b.dataset.dq; updateHash(); reset(); };
    function dqTag(u) { var c = dqCfg(); return u.dq && c ? '<span class="dq" title="' + esc(c.title || '') + '">' + esc(c.short || 'ĐQ') + '</span>' : ''; }
    function renderChips() {
      renderTabs();
      var f = state.filter;
      // Hàng nút Bàn giao (Thô, Giãn xây, Hoàn thiện...), kèm số căn theo các lọc khác
      var bh = state.units.filter(function (u) { return matches(u, 'handover'); });
      var hc = {}; bh.forEach(function (u) { if (u.handover) hc[u.handover] = (hc[u.handover] || 0) + 1; });
      var hs = Object.keys(hc).sort(function (a, b) { return hc[b] - hc[a] || natural(a, b); });
      if (f.handover && hs.indexOf(f.handover) < 0) hs.push(f.handover);
      $('gHandover').hidden = hs.length < 2 && !f.handover;
      $('gHandover').innerHTML = '<span class="lb">Bàn giao</span>' + chip('handover', '', 'Tất cả', bh.length, !f.handover) +
        hs.map(function (h) { return chip('handover', h, h, hc[h] || 0, f.handover === h); }).join('');
      var bp = state.units.filter(function (u) { return matches(u, 'price'); });
      var pc = PRICE_BUCKETS.map(function (b) { return bp.filter(function (u) { return u.price >= b[0] * 1e9 && u.price <= b[1] * 1e9; }).length; });
      var anyPrice = pc.filter(Boolean).length > 1;
      $('gPrice').hidden = !anyPrice;
      $('gPrice').innerHTML = '<span class="lb">Khoảng giá</span>' + PRICE_BUCKETS.map(function (b, i) {
        var on = f.min === String(b[0] || '') && f.max === String(b[1] >= 1e4 ? '' : b[1]);
        if (!pc[i] && !on) return '';
        return chip('price', b[0] + ':' + (b[1] >= 1e4 ? '' : b[1]), b[2], pc[i], on);
      }).join('');
      var bt = state.units.filter(function (u) { return matches(u, 'type'); });
      var tc = {}; bt.forEach(function (u) { if (u.type) tc[u.type] = (tc[u.type] || 0) + 1; });
      var types = Object.keys(tc).sort(function (a, b) { return tc[b] - tc[a]; }).slice(0, 7);
      if (f.type && types.indexOf(f.type) < 0) types.push(f.type);
      $('gType').hidden = types.length < 2;
      $('gType').innerHTML = '<span class="lb">Loại hình</span>' + chip('type', '', 'Tất cả', null, !f.type) + types.map(function (t) { return chip('type', t, t, tc[t] || 0, f.type === t); }).join('');
    }
    root.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('.chip'); if (!c || c.disabled) return;
      var g = c.dataset.g, v = c.dataset.v, f = state.filter;
      if (g === 'handover') f.handover = f.handover === v ? '' : v;
      else if (g === 'type') f.type = f.type === v ? '' : v;
      else if (g === 'price') {
        var p = v.split(':'), lo = p[0] === '0' ? '' : p[0], hi = p[1];
        var on = f.min === lo && f.max === hi;
        f.min = on ? '' : lo; f.max = on ? '' : hi;
        $('fMin').value = f.min; $('fMax').value = f.max;
      }
      reset();
    });

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
    function openUnit(u) {
      state.current = u; updateHash();
      var upd = when(state.data.updatedAt);
      $('mTitle').innerHTML = esc(u.code) + dqTag(u);
      $('mSub').textContent = state.project.name + (u.zone ? ' · ' + u.zone : '') + (u.type ? ' · ' + u.type : '');
      $('mPrice').innerHTML = '<div class="k">Giá niêm yết</div><div class="v">' + ty(u.price) + '</div><div class="k2">Gồm VAT và kinh phí bảo trì</div>';
      function row(k, v, hl) { return v ? '<div class="k">' + k + '</div><div class="v' + (hl ? ' hl' : '') + '">' + v + '</div>' : ''; }
      function link(url, label, main) {
        return url ? '<a class="lk' + (main ? ' main' : '') + '" href="' + esc(url) + '" target="_blank" rel="noopener">' + label + ' <span class="ar">↗</span></a>'
          : '<span class="lk off" title="Chưa có trên bảng hàng, vui lòng gọi hotline">' + label + '</span>';
      }
      var priceSec = '<div class="sec"><div class="sh"><h4>Giá</h4>' + link(u.ptg, 'Phiếu tính giá', true) + '</div><div class="kv">' +
        row('Giá niêm yết', u.price ? vnd(u.price) : 'Liên hệ', true) + row('Giá chưa VAT', u.priceExVat ? vnd(u.priceExVat) : '') +
        row('Giá vay (theo chính sách)', u.priceLoan ? ty(u.priceLoan) : '') + row('Đơn giá', trieu(perM2(u))) + '</div></div>';
      var areaSec = '<div class="sec"><div class="sh"><h4>Diện tích</h4>' + (u.unitLink ? link(u.unitLink, 'Chỉ căn') : '') + '</div><div class="kv">' +
        row('Diện tích đất', u.land != null ? m2(u.land) + ' m²' : '') + row('Diện tích xây dựng', u.build != null ? m2(u.build) + ' m²' : '') + '</div></div>';
      var infoSec = '<div class="sec"><div class="sh"><h4>Thông tin căn</h4></div><div class="kv">' +
        row('Loại hình', esc(u.type)) + row('Hướng', esc(u.direction)) + row('Tiêu chuẩn bàn giao', esc(u.handover)) + row('Phân khu', esc(u.zone)) +
        row('Dãy / đường', esc(u.street)) + '</div></div>';
      var statusSec = '<div class="sec"><div class="sh"><h4>Trạng thái</h4><span class="stt ' + stCls(u.status) + '">' + esc(u.status) + '</span></div><div class="kv">' +
        row('Cập nhật lúc', esc(upd)) + '</div><div class="contact" style="margin-top:12px"><div class="who"><b>Á Đông Land</b><span>Tư vấn dự án ' + esc(state.project.name) + '</span></div>' +
        '<a class="btn primary sm" href="tel:' + esc(C.hotline) + '">Gọi ' + esc(C.hotlineText) + '</a><button class="btn navy sm" id="mZalo">Zalo</button></div>' +
        (projectLink() ? '<a class="lk" style="margin-top:10px" href="' + esc(projectLink()) + '" target="_blank" rel="noopener">Thông tin dự án ' + esc(state.project.name) + ' <span class="ar">↗</span></a>' : '') + '</div>';
      $('mBody').innerHTML = '<div class="msec">' + priceSec + areaSec + infoSec + statusSec + '</div>';
      $('mFoot').innerHTML = '<button class="btn sm" id="mLink">Chia sẻ link căn</button><button class="btn sm" id="mCopy">Sao chép thông tin</button>' +
        '<p class="legal">Giá tham khảo theo bảng hàng cập nhật lúc ' + esc(upd) + '. Giá và chính sách có thể thay đổi theo xác nhận của chủ đầu tư.</p>';
      var info = 'Căn ' + u.code + ', ' + state.project.name + '\nGiá niêm yết: ' + ty(u.price) + ' (gồm VAT và KPBT)' +
        (u.land != null ? '\nDiện tích đất: ' + m2(u.land) + ' m²' : '') + (u.build != null ? ', xây dựng: ' + m2(u.build) + ' m²' : '') +
        (u.type ? '\nLoại hình: ' + u.type : '') + (u.handover ? ', bàn giao: ' + u.handover : '') + (u.direction ? '\nHướng: ' + u.direction : '') + (u.ptg ? '\nPhiếu tính giá: ' + u.ptg : '') + '\nTình trạng: ' + u.status + (projectLink() ? '\nThông tin dự án: ' + projectLink() : '');
      $('mZalo').onclick = function () { copy('Tôi muốn tìm hiểu căn ' + u.code + ' dự án ' + state.project.name + ' (giá niêm yết ' + ty(u.price) + ').', 'Đã sao chép tin nhắn, dán vào Zalo để gửi'); window.open(C.zalo, '_blank', 'noopener'); };
      $('mLink').onclick = function () { copy(location.href, 'Đã sao chép link căn'); };
      $('mCopy').onclick = function () { copy(info, 'Đã sao chép thông tin căn'); };
      var list = state.visible || [], i = list.indexOf(u);
      $('mPrev').disabled = i <= 0; $('mNext').disabled = i < 0 || i >= list.length - 1;
      $('mPrev').style.opacity = $('mPrev').disabled ? .35 : 1; $('mNext').style.opacity = $('mNext').disabled ? .35 : 1;
      $('modal').classList.add('open'); $('mClose').focus();
    }
    $('mPrev').onclick = function () { var l = state.visible || [], i = l.indexOf(state.current); if (i > 0) openUnit(l[i - 1]); };
    $('mNext').onclick = function () { var l = state.visible || [], i = l.indexOf(state.current); if (i >= 0 && i < l.length - 1) openUnit(l[i + 1]); };
    function closeModal() { $('modal').classList.remove('open'); state.current = null; updateHash(); }
    $('mClose').onclick = closeModal;
    $('modal').onclick = function (e) { if (e.target === $('modal')) closeModal(); };
    document.addEventListener('keydown', function (e) {
      if (!$('modal').classList.contains('open')) return;
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowLeft') $('mPrev').click();
      else if (e.key === 'ArrowRight') $('mNext').click();
    });
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
            ptg: i % 4 ? 'https://drive.google.com/drive/folders/minh-hoa' : '', dq: d[6] ? 1 : 0, priceExVat: Math.round((d[5] + (i % 5) * 0.21e9) / 1.1 / 1e6) * 1e6, priceLoan: Math.round((d[5] + (i % 5) * 0.21e9) * 1.03 / 1e7) * 1e7 });
        }
      });
      return out;
    }
    return { ok: true, updatedAt: new Date().toISOString(), exclusiveTab: { enabled: true, short: 'ĐQ', label: 'ĐQ Á Đông Land', title: 'Giỏ hàng độc quyền Á Đông Land' }, projects: [
      { id: 'VHSGP', name: 'Vinhomes Saigon Park', units: gen([['', 'AS76', 'LK', 50, 14, 5.8e9, 1], ['', 'TL12A', 'Liền kề', 50, 12, 5.9e9], ['', 'AS85', 'LK (GÓC)', 60, 8, 6.5e9], ['', 'ĐLCV2', 'SL', 112, 6, 17.2e9, 1], ['', 'AS60', 'Liền kề xẻ khe', 70, 10, 9.6e9]]) },
      { id: 'VHCG', name: 'Vinhomes Green Paradise', units: gen([['VỊNH NGỌC', 'AS24', 'SL', 280, 6, 31.2e9], ['VỊNH NGỌC', 'TĐX', 'SL', 180, 6, 45.1e9], ['VỊNH TIÊN', 'VT44', 'LK', 80, 8, 14.9e9]]) }
    ] };
  }

  function init() { Array.prototype.forEach.call(document.querySelectorAll('[data-adl-bang-hang]'), mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.ADLBangHang = { mount: mount, refresh: init };
})();
