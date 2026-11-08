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
  .loan .in, .loan .out { grid-template-columns: 1fr 1fr; }
}
`;

  var HTML = `
<div class="w">
  <section class="hero" id="hero">
    <div class="hero-top">
      <div><p class="eyebrow">Bảng hàng</p><h2 id="hName">Đang tải bảng hàng</h2><p id="hSub">Bảng giá tham khảo do Á Đông Land tư vấn.</p><a class="plink" id="hLink" target="_blank" rel="noopener" hidden>Thông tin dự án <span>↗</span></a></div>
      <div class="switch" id="projects" role="tablist" aria-label="Chọn dự án"></div>
    </div>
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
  <div class="zoom" id="zoom" role="dialog" aria-modal="true" aria-label="Ảnh chỉ căn"><div class="zbar"><span id="zTitle"></span><span><a id="zOrig" target="_blank" rel="noopener">Ảnh gốc ↗</a> <button id="zClose" aria-label="Đóng">Đóng ×</button></span></div><img id="zImg" alt=""></div>
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
      $('hSub').textContent = (state.data.demo ? 'Dữ liệu minh họa. ' : '') + 'Bảng giá tham khảo do Á Đông Land tư vấn, cập nhật lúc ' + upd + '.';
      $('legal').textContent = 'Giá niêm yết đã gồm VAT và kinh phí bảo trì, theo bảng hàng cập nhật lúc ' + upd +
        '. Đơn giá tính bằng giá niêm yết chia diện tích đất. Giá và chính sách có thể thay đổi theo sản phẩm, thời điểm và xác nhận của chủ đầu tư.' +
        (state.project.incomplete ? ' Một phần giỏ hàng đang cập nhật, vui lòng gọi hotline để có danh sách đầy đủ.' : '');
      host.dispatchEvent(new CustomEvent('adl:update', { bubbles: true, detail: { project: { id: state.project.id, name: state.project.name }, updatedAt: state.data.updatedAt, demo: !!state.data.demo } }));
      buildOptions(); render();
    }

    function projectLink() { var l = (C.projectLinks || {})[state.project && state.project.id]; return /^https:\/\//i.test(l || '') ? l : ''; }

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
        else if (u[d.k] !== v) return false;
      }
      if (q && q.split(/\s+/).some(function (w) { return norm([u.code, u.zone, u.street, u.type, u.direction, u.handover].join(' ')).indexOf(w) < 0; })) return false;
      return true;
    }

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
    function dqTag(u) { var c = dqCfg(); return u.dq && c ? '<span class="dq" title="' + esc(c.title || '') + '">' + esc(c.short || 'ĐQ') + '</span>' : ''; }
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
      return '<div class="poster"><div class="brand"><b>Á Đông Land</b><span>' + esc(state.project.name) + '</span></div>' +
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
      var list = C.contacts && C.contacts.length ? C.contacts : [{ name: 'Á Đông Land', role: 'Tư vấn dự án ' + state.project.name, phone: C.hotline, phoneText: C.hotlineText, zalo: C.zalo }];
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
        var showZoom = function () { openZoom(img, u); };
        im.onload = function () { im.classList.add('ok'); $('mMedia').classList.remove('loading'); };
        im.onerror = function () { var m = $('mMedia'); m.className = 'media no-img'; m.innerHTML = posterHtml(u); };
        $('mMedia').onclick = function (e) { if (!e.target.closest('a')) showZoom(); };
      }
      // Cột phải: các mục thông tin
      function r(k, v, hl, full) { return v ? '<div class="r' + (full ? ' full' : '') + '"><span class="k">' + k + ':</span><span class="v' + (hl ? ' hl' : '') + '">' + v + '</span></div>' : ''; }
      function lk(url, label, id) { return url ? '<a class="lk" href="' + esc(url) + '" target="_blank" rel="noopener">' + label + '<span class="ar">↗</span></a>' : (id ? '<button class="lk" id="' + id + '">' + label + '</button>' : ''); }
      var dqc = dqCfg();
      $('mRight').innerHTML =
        '<div class="blk"><div class="bh"><h4>Giá</h4><div class="tools2">' + lk(u.ptg, 'Phiếu tính giá') + '<button class="lk" id="mLoanBtn">Tính lãi vay</button></div></div>' +
          '<div class="g2">' + r('Giá niêm yết', u.price ? ty(u.price) : 'Liên hệ', true) + r('Giá chưa VAT', u.priceExVat ? ty(u.priceExVat) : '') +
          r('Giá vay', u.priceLoan ? ty(u.priceLoan) : '') + r('Đơn giá', trieu(perM2(u))) + '</div>' + loanCalc(u) + '</div>' +
        '<div class="blk"><div class="bh"><h4>Diện tích</h4><div class="tools2">' + lk(u.unitLink, 'Chỉ căn') + '</div></div>' +
          '<div class="g2">' + r('DT đất', u.land != null ? m2(u.land) + ' m²' : '') + r('DT xây dựng', u.build != null ? m2(u.build) + ' m²' : '') + '</div></div>' +
        '<div class="blk"><div class="bh"><h4>Thông tin bàn giao</h4></div><div class="g2">' + r('Tiêu chuẩn bàn giao', esc(u.handover), false, true) +
          r('Quỹ căn', u.dq && dqc ? esc(dqc.label || 'ĐQ') : '', false, true) + r('Phân khu', esc(u.zone), false, true) + r('Dãy / đường', esc(u.street), false, true) + '</div></div>' +
        '<div class="blk"><div class="bh"><h4>Trạng thái</h4><span class="stt ' + stCls(u.status) + '">' + esc(u.status) + '</span></div>' +
          '<div class="g2">' + r('Cập nhật gần nhất', esc(upd), false, true) + '</div><div class="people">' + contacts() + '</div>' +
          '<div class="mfoot">' + (projectLink() ? lk(projectLink(), 'Thông tin dự án') : '') +
          '<p class="legal">Giá tham khảo theo bảng hàng cập nhật lúc ' + esc(upd) + '. Giá và chính sách có thể thay đổi theo xác nhận của chủ đầu tư.</p></div></div>';
      var info = 'Căn ' + u.code + ', ' + state.project.name + '\n' + 'Giá niêm yết: ' + ty(u.price) + ' (gồm VAT và KPBT)' +
        (u.land != null ? '\nDiện tích đất: ' + m2(u.land) + ' m²' : '') + (u.build != null ? ', xây dựng: ' + m2(u.build) + ' m²' : '') +
        (u.type ? '\nLoại hình: ' + u.type : '') + (u.handover ? ', bàn giao: ' + u.handover : '') + (u.direction ? '\nHướng: ' + u.direction : '') +
        (u.ptg ? '\nPhiếu tính giá: ' + u.ptg : '') + '\nTình trạng: ' + u.status + (projectLink() ? '\nThông tin dự án: ' + projectLink() : '');
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
    function openZoom(src, u) {
      $('zImg').src = src; $('zImg').alt = 'Ảnh chỉ căn ' + u.code; $('zTitle').textContent = u.code;
      $('zOrig').href = u.unitLink || src; $('zoom').classList.add('open'); $('zoom').scrollTop = 0;
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
