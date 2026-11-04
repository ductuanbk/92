/*!
 * Bảng hàng Á Đông Land: khối nhúng cho website (WordPress/Flatsome hoặc trang bất kỳ).
 *
 * Cách dùng trên WordPress: dán file wordpress/bang-hang-cong-khai.html (đã gồm sẵn mã này,
 * nén một dòng) vào phần tử HTML của Flatsome hoặc khối HTML tùy chỉnh. Không cần tải file ngoài.
 * Tạo lại file đó sau khi sửa mã này: node tools/build-wordpress.mjs
 *
 * Tùy chọn (thuộc tính trên thẻ div):
 *   data-du-an="VHSGP"   chỉ hiện một dự án (VHSGP hoặc VHCG), ẩn thanh chọn dự án
 *   data-tieu-de="0"     ẩn dòng tiêu đề nhỏ phía trên bảng
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
    hotline: '0933772422',
    hotlineText: '0933 772 422',
    zalo: 'https://zalo.me/386470265573132310',
    projectOrder: ['VHSGP', 'VHCG'],
    refreshSeconds: 120
  };
  var C = Object.assign({}, DEFAULTS, window.ADL_SITE || {});

  // Font dùng chung (nạp một lần vào trang cha; Shadow DOM kế thừa được font đã nạp).
  if (!document.querySelector('link[data-adl-font]')) {
    var lf = document.createElement('link');
    lf.rel = 'stylesheet'; lf.setAttribute('data-adl-font', '');
    lf.href = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(lf);
  }

  var CSS = [
    ':host { all: initial; display: block; }',
    '.w { --brand: #a31d24; --navy: #0b1f4b; --ink: #2b3445; --muted: #8a94a6; --line: #eef0f4; --hover: #f8f9fb; --pill: #ffecec; --pill-ink: #e3262d; --accent: #f08c00; --ok: #16a05d; --hold: #c07a00; --sold: #8a94a6;',
    '  container-type: inline-size; color: var(--ink); font: 14px/1.5 "Be Vietnam Pro", -apple-system, "Segoe UI", Roboto, Arial, sans-serif; text-align: left;',
    '  letter-spacing: normal; word-spacing: normal; text-transform: none; text-indent: 0; white-space: normal; font-style: normal; font-weight: 400; }',
    '.w *, .w *::before, .w *::after { box-sizing: border-box; }',
    'button, input, select { font: inherit; color: inherit; margin: 0; }',
    'a { color: var(--brand); }',
    '[hidden] { display: none !important; }',
    '.sub { color: var(--muted); font-size: 13px; margin: 0 0 10px; }',
    '.sub b { color: var(--navy); }',
    '.projects { display: flex; justify-content: center; margin: 0 0 18px; flex-wrap: wrap; }',
    '.projects button { background: none; border: none; border-bottom: 2px solid transparent; padding: 8px 16px; cursor: pointer; position: relative; font-weight: 500; border-radius: 0; }',
    '.projects button + button::before { content: ""; position: absolute; left: 0; top: 11px; bottom: 11px; width: 1px; background: #c9ced8; }',
    '.projects button.on { color: var(--accent); border-bottom-color: var(--accent); }',
    '.head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }',
    '.head h2 { margin: 0; font-size: 26px; font-weight: 700; color: var(--navy); letter-spacing: -.3px; line-height: 1.2; }',
    '.spacer { flex: 1; }',
    '.search { width: 230px; padding: 9px 12px; border: 1px solid #e3e6ec; border-radius: 8px; background: #fff; height: auto; box-shadow: none; }',
    '.sort { display: inline-flex; align-items: center; gap: 6px; }',
    '.sort span { font-size: 11px; color: var(--muted); }',
    '.sort select { padding: 9px 12px; border: 1px solid #e3e6ec; border-radius: 8px; background: #fff; min-width: 180px; height: auto; }',
    '.fbtn { display: inline-flex; align-items: center; gap: 8px; background: #f2f4f7; border: 1px solid var(--line); border-radius: 8px; padding: 9px 18px; cursor: pointer; font-weight: 600; color: var(--navy); text-transform: none; letter-spacing: 0; min-height: 0; line-height: 1.5; }',
    '.fbtn.on { background: var(--navy); color: #fff; }',
    '.badge { display: inline-block; min-width: 18px; padding: 0 6px; border-radius: 999px; background: var(--pill-ink); color: #fff; font-size: 11px; line-height: 18px; text-align: center; }',
    '.filters { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; background: #fafbfc; border: 1px solid var(--line); border-radius: 10px; padding: 14px; margin-bottom: 14px; align-items: end; }',
    '.filters label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .3px; }',
    '.filters select, .filters input { text-transform: none; letter-spacing: 0; font-size: 14px; color: var(--ink); padding: 8px 10px; border: 1px solid #e3e6ec; border-radius: 8px; background: #fff; width: 100%; min-width: 0; height: auto; }',
    '.filters .wide { grid-column: span 2; }',
    '.range { display: flex; gap: 6px; }',
    '.btn { background: #fff; border: 1px solid #e3e6ec; padding: 8px 12px; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; color: var(--ink); text-transform: none; letter-spacing: 0; line-height: 1.4; min-height: 0; }',
    '.btn.primary { background: var(--brand); border-color: var(--brand); color: #fff; font-weight: 600; }',
    '.btn.navy { background: var(--navy); border-color: var(--navy); color: #fff; font-weight: 600; }',
    '.stbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }',
    '.stbar button { display: inline-flex; align-items: center; gap: 7px; border: 1px solid #e3e6ec; background: #fff; border-radius: 999px; padding: 6px 14px; cursor: pointer; font-size: 13px; text-transform: none; letter-spacing: 0; min-height: 0; line-height: 1.4; }',
    '.stbar button b { color: var(--navy); }',
    '.stbar button.on { background: var(--navy); border-color: var(--navy); color: #fff; }',
    '.stbar button.on b { color: #fff; }',
    '.stbar .dot, .stt::before { width: 7px; height: 7px; border-radius: 50%; background: var(--c); content: ""; display: inline-block; }',
    '.stbar .info { margin-left: auto; color: var(--muted); font-size: 13px; }',
    '.s-ok { --c: var(--ok); } .s-hold { --c: var(--hold); } .s-sold { --c: var(--sold); } .s-other { --c: var(--navy); }',
    '.tw { border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 2px 10px rgba(16,24,40,.05); overflow: auto; max-height: 75vh; background: #fff; }',
    'table { border-collapse: collapse; width: 100%; margin: 0; border: 0; }',
    'th, td { text-align: left; white-space: nowrap; padding: 10px; border: 0; border-bottom: 1px solid #f1f3f6; border-right: 1px solid #f7f8fa; font-size: 14px; vertical-align: middle; background: transparent; }',
    'th { position: sticky; top: 0; background: #fff; color: #9aa3b2; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .2px; cursor: pointer; user-select: none; z-index: 1; border-bottom-color: var(--line); }',
    'th .si { color: #c3c9d4; font-size: 11px; margin-left: 3px; }',
    'th.sorted { color: var(--navy); } th.sorted .si { color: var(--accent); } th.nosort { cursor: default; }',
    'tbody tr { cursor: pointer; } tbody tr:hover td { background: var(--hover); }',
    '.code { display: inline-block; background: var(--pill); color: var(--pill-ink); font-weight: 600; padding: 1px 7px; border-radius: 4px; letter-spacing: .3px; }',
    '.price { font-weight: 700; color: var(--navy); }',
    '.up { text-transform: uppercase; }',
    '.m2 { color: #b3bac6; font-size: 10px; margin-left: 2px; }',
    '.stt { display: inline-flex; align-items: center; gap: 6px; font-weight: 500; color: var(--c); }',
    '.empty { padding: 40px; text-align: center; color: var(--muted); white-space: normal; }',
    '.legal { color: var(--muted); font-size: 12px; margin: 10px 2px 0; }',
    '.cards { display: none; }',
    '.card { border: 1px solid var(--line); border-radius: 10px; padding: 12px; margin-bottom: 8px; box-shadow: 0 1px 6px rgba(16,24,40,.05); cursor: pointer; background: #fff; }',
    '.card .r1, .card .r2 { display: flex; justify-content: space-between; align-items: center; gap: 8px; }',
    '.card .r2 { margin-top: 6px; align-items: baseline; }',
    '.card .meta { color: #6b7385; font-size: 13px; margin-top: 2px; }',
    '.mbg { position: fixed; inset: 0; background: rgba(11,31,75,.35); display: none; align-items: center; justify-content: center; z-index: 2147483000; padding: 16px; }',
    '.mbg.open { display: flex; }',
    '.modal { background: #fff; border-radius: 14px; width: min(520px, 100%); max-height: 92vh; overflow: auto; box-shadow: 0 20px 50px rgba(0,0,0,.2); }',
    '.mh { padding: 18px 20px 10px; display: flex; align-items: flex-start; gap: 10px; }',
    '.mh h3 { margin: 0; font-size: 22px; color: var(--navy); line-height: 1.3; }',
    '.mb { padding: 0 20px 20px; }',
    '.close { margin-left: auto; background: none; border: none; font-size: 26px; line-height: 1; cursor: pointer; color: var(--muted); padding: 0 4px; min-height: 0; }',
    'dl { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; margin: 8px 0 16px; }',
    'dt { color: var(--muted); font-weight: 400; } dd { margin: 0; }',
    '.big { font-size: 22px; font-weight: 800; color: var(--navy); }',
    '.ctas { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }',
    '.ctas .btn { text-align: center; padding: 11px 12px; }',
    '.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #222; color: #fff; padding: 10px 16px; border-radius: 8px; z-index: 2147483001; display: none; }',
    '.toast.show { display: block; }',
    // Bố cục theo bề rộng khung chứa (không theo màn hình), để vừa cột nội dung của theme.
    '@container (max-width: 1250px) { .col-direction { display: none; } }',
    '@container (max-width: 1080px) { .col-build, .col-handover { display: none; } }',
    '@container (max-width: 900px) { .col-perM2 { display: none; } }',
    '@container (max-width: 720px) {',
    '  .projects { justify-content: flex-start; overflow-x: auto; flex-wrap: nowrap; } .projects button { white-space: nowrap; }',
    '  .head h2 { font-size: 22px; width: 100%; } .search { width: 100%; } .sort { flex: 1; } .sort select { min-width: 0; width: 100%; }',
    '  .filters { grid-template-columns: 1fr 1fr; } .filters .wide { grid-column: 1 / -1; }',
    '  .stbar .info { width: 100%; margin-left: 0; }',
    '  .tw { display: none; } .cards { display: block; }',
    '  dl { grid-template-columns: 110px 1fr; }',
    '}'
  ].join('\n');

  var HTML = [
    '<div class="w">',
    '  <p class="sub" id="sub"></p>',
    '  <nav class="projects" id="projects" aria-label="Chọn dự án"></nav>',
    '  <div class="head">',
    '    <h2>BẢNG HÀNG</h2><span class="spacer"></span>',
    '    <input class="search" id="q" type="search" placeholder="Tìm mã căn, phân khu..." aria-label="Tìm mã căn">',
    '    <label class="sort"><span>Sắp xếp:</span><select id="sortSel">',
    '      <option value="default">Mặc định</option><option value="price:1">Giá thấp → cao</option><option value="price:-1">Giá cao → thấp</option>',
    '      <option value="perM2:1">Đơn giá thấp → cao</option><option value="land:-1">DT đất lớn → nhỏ</option><option value="code:1">Mã căn A → Z</option>',
    '      <option value="custom" hidden>Theo cột đã chọn</option></select></label>',
    '    <button class="fbtn" id="filterBtn" aria-expanded="false">Bộ lọc <span class="badge" id="filterCount" hidden></span></button>',
    '  </div>',
    '  <div class="filters" id="filterPanel" hidden>',
    '    <label>Phân khu<select id="fZone"></select></label><label>Loại hình<select id="fType"></select></label>',
    '    <label>Hướng<select id="fDirection"></select></label><label>Bàn giao<select id="fHandover"></select></label>',
    '    <label>DT đất từ (m²)<input id="fLand" type="number" min="0" step="5" placeholder="Ví dụ 80"></label>',
    '    <label class="wide">Giá niêm yết (tỷ)<span class="range"><input id="fMin" type="number" min="0" step="0.5" placeholder="Từ"><input id="fMax" type="number" min="0" step="0.5" placeholder="Đến"></span></label>',
    '    <button class="btn" id="clearFilters">Xóa bộ lọc</button>',
    '  </div>',
    '  <div class="stbar" id="stbar"></div>',
    '  <div class="tw"><table><thead id="thead"></thead><tbody id="tbody"><tr><td><div class="empty">Đang tải bảng hàng...</div></td></tr></tbody></table></div>',
    '  <div class="cards" id="cards"><div class="empty">Đang tải bảng hàng...</div></div>',
    '  <p class="legal" id="legal"></p>',
    '  <div class="mbg" id="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="modal">',
    '    <div class="mh"><div><h3 id="mTitle"></h3><div id="mSub" style="color:var(--muted)"></div></div><button class="close" id="mClose" aria-label="Đóng">×</button></div>',
    '    <div class="mb" id="mBody"></div></div></div>',
    '  <div class="toast" id="toast" role="status"></div>',
    '</div>'
  ].join('\n');

  // ─── Tiện ích dùng chung ───
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase(); }
  function natural(a, b) { return String(a).localeCompare(String(b), 'vi', { numeric: true, sensitivity: 'base' }); }
  function ty(n) { return n ? (n / 1e9).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' tỷ' : 'Liên hệ'; }
  function vnd(n) { return n ? Math.round(n).toLocaleString('vi-VN') + ' đồng' : 'Liên hệ'; }
  function m2(n) { return n == null || n === '' ? '' : Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 1 }); }
  function perM2(u) { return u.price && u.land ? u.price / u.land : null; }
  function trieu(n) { return n ? (n / 1e6).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' triệu/m²' : ''; }
  var TYPE_FULL = { lk: 'Liền kề', sl: 'Song lập', dl: 'Đơn lập', sh: 'Shophouse', bt: 'Biệt thự' };
  function fullType(t) { return TYPE_FULL[norm(t).trim()] || t || ''; }
  function stCls(s) { return s === 'Còn hàng' ? 's-ok' : s === 'Đang giữ chỗ' ? 's-hold' : s === 'Đã bán' ? 's-sold' : 's-other'; }
  function rank(s) { var r = { 'Còn hàng': 0, 'Đang giữ chỗ': 1, 'Liên hệ': 2, 'Đã bán': 3 }[s]; return r == null ? 2 : r; }
  function when(iso) {
    var d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ngày ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function hashParams() { var h = new URLSearchParams(location.hash.replace(/^#/, '')); var q = new URLSearchParams(location.search); return { p: h.get('du-an') || q.get('p'), u: h.get('can') || q.get('u') }; }

  // Một lần tải dùng chung cho mọi khối trên trang.
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
  function fetchData(force) {
    if (shared && !force) return shared;
    var demo = new URLSearchParams(location.search).get('demo') === '1';
    shared = (demo ? Promise.resolve(demoData()) : jsonp(C.API_URL)).then(function (d) {
      if (!d || !d.ok) throw new Error((d && d.error) || 'bad');
      d.demo = demo;
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
    var showSub = host.getAttribute('data-tieu-de') !== '0';
    var useHash = host.getAttribute('data-lien-ket') !== '0';
    var state = { data: null, project: null, units: [], filter: blank(), sort: { key: 'default', dir: 1 }, current: null };
    function blank() { return { q: '', zone: '', type: '', direction: '', handover: '', land: '', min: '', max: '', status: '' }; }
    function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2600); }

    function load(silent, force) {
      return fetchData(force).then(function (d) {
        state.data = d;
        var order = C.projectOrder || [];
        var projects = d.projects.slice().sort(function (a, b) { return (order.indexOf(a.id) + 99) % 99 - (order.indexOf(b.id) + 99) % 99; });
        if (lockProject) projects = projects.filter(function (p) { return p.id === lockProject; });
        if (!projects.length) throw new Error('noproject');
        state.projects = projects;
        $('projects').hidden = projects.length < 2;
        $('projects').innerHTML = projects.map(function (p) { return '<button data-p="' + esc(p.id) + '">' + esc(p.name) + '</button>'; }).join('');
        var hp = hashParams();
        var want = state.project ? state.project.id : hp.p;
        selectProject(projects.some(function (x) { return x.id === want; }) ? want : projects[0].id, silent);
        if (!silent && hp.u) { var u = findCode(hp.u); if (u) openUnit(u); }
      }).catch(function (err) {
        if (silent) return;
        var code = (err && err.message) || 'unknown';
        var why = { timeout: 'máy chủ dữ liệu phản hồi quá lâu', network: 'không kết nối được máy chủ dữ liệu', invalid: 'máy chủ dữ liệu chưa sẵn sàng (chưa cấp quyền hoặc sai link)', bad: 'máy chủ dữ liệu báo lỗi', noproject: 'không có dự án phù hợp' }[code] || code;
        if (window.console) console.warn('[Bảng hàng ADL] Lỗi tải dữ liệu:', code, C.API_URL);
        var msg = '<div class="empty">Bảng hàng đang được cập nhật. Vui lòng gọi ' + esc(C.hotlineText) + ' để nhận giỏ hàng mới nhất.' +
          '<br><small style="opacity:.7">Mã lỗi: ' + esc(code) + ' (' + esc(why) + ')</small></div>';
        $('tbody').innerHTML = '<tr><td>' + msg + '</td></tr>'; $('cards').innerHTML = msg;
      });
    }
    $('projects').onclick = function (e) { var b = e.target.closest('button'); if (b) { selectProject(b.dataset.p); updateHash(); } };

    function selectProject(id, keep) {
      var changed = !state.project || state.project.id !== id;
      state.project = state.projects.filter(function (p) { return p.id === id; })[0];
      state.units = state.project.units;
      if (changed && !keep) { state.filter = blank(); ['q', 'fMin', 'fMax', 'fLand'].forEach(function (x) { $(x).value = ''; }); }
      Array.prototype.forEach.call($('projects').children, function (b) { b.classList.toggle('on', b.dataset.p === id); });
      var upd = when(state.data.updatedAt);
      $('sub').hidden = !showSub;
      $('sub').innerHTML = (state.data.demo ? '<b>Dữ liệu minh họa.</b> ' : '') + 'Bảng giá tham khảo <b>' + esc(state.project.name) + '</b>, cập nhật lúc ' + esc(upd) + '.';
      $('legal').textContent = 'Giá niêm yết đã gồm VAT và kinh phí bảo trì, theo bảng hàng cập nhật lúc ' + upd +
        '. Đơn giá tính bằng giá niêm yết chia diện tích đất. Giá và chính sách có thể thay đổi theo sản phẩm, thời điểm và xác nhận của chủ đầu tư.' +
        (state.project.incomplete ? ' Một phần giỏ hàng đang cập nhật, vui lòng gọi hotline để có danh sách đầy đủ.' : '');
      host.dispatchEvent(new CustomEvent('adl:update', { bubbles: true, detail: { project: { id: state.project.id, name: state.project.name }, updatedAt: state.data.updatedAt, demo: !!state.data.demo } }));
      buildOptions(); render();
    }

    function opts(id, values, cur, map) {
      var u = values.filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort(natural);
      $(id).innerHTML = '<option value="">Tất cả</option>' + u.map(function (v) { return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(map ? map(v) : v) + '</option>'; }).join('');
      $(id).closest('label').hidden = !u.length;
    }
    function buildOptions() {
      var u = state.units, f = state.filter;
      opts('fZone', u.map(function (x) { return x.zone; }), f.zone);
      opts('fType', u.map(function (x) { return x.type; }), f.type, fullType);
      opts('fDirection', u.map(function (x) { return x.direction; }), f.direction);
      opts('fHandover', u.map(function (x) { return x.handover; }), f.handover);
    }
    var FMAP = { fZone: 'zone', fType: 'type', fDirection: 'direction', fHandover: 'handover' };
    Object.keys(FMAP).forEach(function (id) { $(id).onchange = function () { state.filter[FMAP[id]] = this.value; render(); }; });
    ['fMin', 'fMax', 'fLand'].forEach(function (id) { $(id).oninput = function () { state.filter[{ fMin: 'min', fMax: 'max', fLand: 'land' }[id]] = this.value; render(); }; });
    var qt; $('q').oninput = function () { var v = this.value; clearTimeout(qt); qt = setTimeout(function () { state.filter.q = v; render(); }, 150); };
    $('clearFilters').onclick = function () { var st = state.filter.status; state.filter = blank(); state.filter.status = st; ['q', 'fMin', 'fMax', 'fLand'].forEach(function (x) { $(x).value = ''; }); buildOptions(); render(); };
    $('filterBtn').onclick = function () { var p = $('filterPanel'); p.hidden = !p.hidden; this.classList.toggle('on', !p.hidden); this.setAttribute('aria-expanded', String(!p.hidden)); };
    $('sortSel').onchange = function () { var v = this.value; state.sort = v === 'default' ? { key: 'default', dir: 1 } : { key: v.split(':')[0], dir: Number(v.split(':')[1]) }; render(); };
    function panelCount() { var f = state.filter; return ['zone', 'type', 'direction', 'handover', 'land'].filter(function (k) { return f[k]; }).length + (f.min || f.max ? 1 : 0); }

    function filtered() {
      var f = state.filter, q = norm(f.q).trim();
      var min = f.min !== '' ? Number(f.min) * 1e9 : null, max = f.max !== '' ? Number(f.max) * 1e9 : null, land = f.land !== '' ? Number(f.land) : null;
      return state.units.filter(function (u) {
        if (f.zone && u.zone !== f.zone) return false;
        if (f.type && u.type !== f.type) return false;
        if (f.direction && u.direction !== f.direction) return false;
        if (f.handover && u.handover !== f.handover) return false;
        if (land != null && !(u.land >= land)) return false;
        if (min != null && !(u.price >= min)) return false;
        if (max != null && !(u.price <= max)) return false;
        if (q && q.split(/\s+/).some(function (w) { return norm([u.code, u.zone, u.street, fullType(u.type), u.direction].join(' ')).indexOf(w) < 0; })) return false;
        return true;
      });
    }

    var COLS = [
      { k: 'code', l: 'Mã căn', cell: function (u) { return '<span class="code">' + esc(u.code) + '</span>'; } },
      { k: 'price', l: 'Giá niêm yết', title: 'Đã gồm VAT và kinh phí bảo trì', cell: function (u) { return '<span class="price">' + ty(u.price) + '</span>'; } },
      { k: 'perM2', l: 'Đơn giá', title: 'Giá niêm yết chia diện tích đất', cell: function (u) { return trieu(perM2(u)) || '<span style="color:var(--muted)">-</span>'; } },
      { k: 'type', l: 'Loại hình', cell: function (u) { return '<span class="up">' + esc(fullType(u.type)) + '</span>'; } },
      { k: 'direction', l: 'Hướng', cell: function (u) { return '<span class="up">' + esc(u.direction) + '</span>'; } },
      { k: 'land', l: 'DT đất', cell: function (u) { return u.land != null ? m2(u.land) + '<span class="m2">m²</span>' : ''; } },
      { k: 'build', l: 'DT xây dựng', cell: function (u) { return u.build != null ? m2(u.build) + '<span class="m2">m²</span>' : ''; } },
      { k: 'handover', l: 'Bàn giao', cell: function (u) { return esc(u.handover); } },
      { k: 'zone', l: 'Phân khu', cell: function (u) { return '<span class="up">' + esc(u.zone) + '</span>'; } },
      { k: 'status', l: 'Tình trạng', cell: function (u) { return '<span class="stt ' + stCls(u.status) + '">' + esc(u.status) + '</span>'; } }
    ];
    function cols() {
      return COLS.filter(function (c) {
        if (['code', 'price', 'status'].indexOf(c.k) >= 0) return true;
        return state.units.some(function (u) { var v = c.k === 'perM2' ? perM2(u) : u[c.k]; return v != null && v !== ''; });
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
      var base = filtered();
      var cnt = {}; base.forEach(function (u) { cnt[u.status] = (cnt[u.status] || 0) + 1; });
      var rows = sortRows(state.filter.status ? base.filter(function (u) { return u.status === state.filter.status; }) : base);
      var avail = base.filter(function (u) { return u.status === 'Còn hàng' && u.price; }).map(function (u) { return u.price; });
      $('stbar').innerHTML = '<button data-s=""' + (state.filter.status ? '' : ' class="on"') + '>Tất cả <b>' + base.length + '</b></button>' +
        ['Còn hàng', 'Đang giữ chỗ', 'Liên hệ', 'Đã bán'].filter(function (s) { return cnt[s]; }).map(function (s) {
          return '<button data-s="' + esc(s) + '" class="' + stCls(s) + (state.filter.status === s ? ' on' : '') + '"><span class="dot"></span>' + esc(s) + ' <b>' + cnt[s] + '</b></button>';
        }).join('') + '<span class="info">' + (avail.length ? 'Giá căn còn hàng: <b>' + ty(Math.min.apply(null, avail)) + ' – ' + ty(Math.max.apply(null, avail)) + '</b>' : '') + '</span>';
      var n = panelCount(); $('filterCount').hidden = !n; $('filterCount').textContent = n;
      var sv = state.sort.key === 'default' ? 'default' : state.sort.key + ':' + state.sort.dir;
      $('sortSel').value = Array.prototype.some.call($('sortSel').options, function (o) { return o.value === sv && !o.hidden; }) ? sv : 'custom';
      var cs = cols();
      $('thead').innerHTML = '<tr>' + cs.map(function (c) {
        var on = state.sort.key === c.k;
        return '<th data-k="' + c.k + '" class="col-' + c.k + (on ? ' sorted' : '') + (c.nosort ? ' nosort' : '') + '"' + (c.title ? ' title="' + esc(c.title) + '"' : '') + '>' +
          esc(c.l) + (c.nosort ? '' : '<span class="si">' + (on ? (state.sort.dir > 0 ? '↑' : '↓') : '⇅') + '</span>') + '</th>';
      }).join('') + '</tr>';
      if (!rows.length) {
        var msg = '<div class="empty">Không có căn phù hợp. Thử bỏ bớt bộ lọc hoặc gọi ' + esc(C.hotlineText) + ' để được gợi ý căn tương tự.</div>';
        $('tbody').innerHTML = '<tr><td colspan="' + cs.length + '">' + msg + '</td></tr>'; $('cards').innerHTML = msg; return;
      }
      $('tbody').innerHTML = rows.map(function (u) {
        return '<tr data-code="' + esc(u.code) + '">' + cs.map(function (c) { return '<td class="col-' + c.k + '">' + c.cell(u) + '</td>'; }).join('') + '</tr>';
      }).join('');
      $('cards').innerHTML = rows.slice(0, 300).map(function (u) {
        return '<div class="card" data-code="' + esc(u.code) + '"><div class="r1"><span class="code">' + esc(u.code) + '</span><span class="stt ' + stCls(u.status) + '">' + esc(u.status) + '</span></div>' +
          '<div class="r2"><span class="price">' + ty(u.price) + '</span><span style="color:var(--muted);font-size:13px">' + trieu(perM2(u)) + '</span></div>' +
          '<div class="meta up" style="font-size:12px">' + esc([fullType(u.type), u.direction, u.zone].filter(Boolean).join(' · ')) + '</div>' +
          '<div class="meta">' + (u.land != null ? 'Đất ' + m2(u.land) + ' m²' : '') + (u.build != null ? ' · Xây dựng ' + m2(u.build) + ' m²' : '') + (u.handover ? ' · ' + esc(u.handover) : '') + '</div></div>';
      }).join('');
    }
    $('stbar').onclick = function (e) { var b = e.target.closest('button[data-s]'); if (b) { state.filter.status = b.dataset.s; render(); } };
    $('thead').onclick = function (e) {
      var th = e.target.closest('th[data-k]'); if (!th || th.classList.contains('nosort')) return;
      var k = th.dataset.k;
      state.sort = { key: k, dir: state.sort.key === k ? -state.sort.dir : (k === 'land' || k === 'build' ? -1 : 1) }; render();
    };
    $('tbody').onclick = $('cards').onclick = function (e) {
      var el = e.target.closest('[data-code]'); if (!el) return;
      var u = findCode(el.dataset.code); if (u) openUnit(u);
    };
    function findCode(c) { var n = norm(c).replace(/\s/g, ''); return state.units.filter(function (u) { return norm(u.code).replace(/\s/g, '') === n; })[0]; }

    function openUnit(u) {
      state.current = u; updateHash();
      $('mTitle').textContent = 'Căn ' + u.code;
      $('mSub').textContent = state.project.name + (u.zone ? ' · ' + u.zone : '');
      var rows = [['Tình trạng', '<span class="stt ' + stCls(u.status) + '">' + esc(u.status) + '</span>'], ['Loại hình', esc(fullType(u.type))], ['Hướng', esc(u.direction)],
        ['Diện tích đất', u.land != null ? m2(u.land) + ' m²' : ''], ['Diện tích xây dựng', u.build != null ? m2(u.build) + ' m²' : ''],
        ['Bàn giao', esc(u.handover)], ['Phân khu', esc(u.zone)], ['Đơn giá', trieu(perM2(u))]].filter(function (r) { return r[1]; });
      $('mBody').innerHTML = '<div style="color:var(--muted);font-size:12px">Giá niêm yết, đã gồm VAT và kinh phí bảo trì</div><div class="big">' + ty(u.price) + '</div>' +
        (u.price ? '<div style="color:var(--muted);font-size:13px">' + vnd(u.price) + '</div>' : '') +
        '<dl>' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>' +
        '<div class="ctas"><a class="btn primary" href="tel:' + esc(C.hotline) + '">Gọi ' + esc(C.hotlineText) + '</a>' +
        '<button class="btn navy" id="mZalo">Hỏi căn này qua Zalo</button></div>' +
        '<div style="margin-top:8px"><button class="btn" id="mLink" style="width:100%">Sao chép link căn</button></div>' +
        '<p class="legal">Giá tham khảo theo bảng hàng cập nhật lúc ' + when(state.data.updatedAt) + '. Giá và chính sách có thể thay đổi theo xác nhận của chủ đầu tư.</p>';
      $('mZalo').onclick = function () {
        copy('Tôi muốn tìm hiểu căn ' + u.code + ' dự án ' + state.project.name + ' (giá niêm yết ' + ty(u.price) + ').', 'Đã sao chép tin nhắn, dán vào Zalo để gửi');
        window.open(C.zalo, '_blank', 'noopener');
      };
      $('mLink').onclick = function () { copy(location.href, 'Đã sao chép link căn'); };
      $('modal').classList.add('open'); $('mClose').focus();
    }
    function closeModal() { $('modal').classList.remove('open'); state.current = null; updateHash(); }
    $('mClose').onclick = closeModal;
    $('modal').onclick = function (e) { if (e.target === $('modal')) closeModal(); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('modal').classList.contains('open')) closeModal(); });
    function copy(t, msg) {
      var ok = function () { toast(msg); };
      var fb = function () { var a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); ok(); } catch (e) { /* bỏ qua */ } a.remove(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb); else fb();
    }
    function updateHash() {
      if (!useHash) return;
      var p = new URLSearchParams();
      if (state.project && !lockProject) p.set('du-an', state.project.id);
      if (state.current) p.set('can', state.current.code);
      var h = p.toString();
      try { history.replaceState(null, '', location.pathname + location.search + (h ? '#' + h : '')); } catch (e) { /* bỏ qua */ }
    }

    load(false);
    if (C.refreshSeconds) setInterval(function () { if (!document.hidden && !$('modal').classList.contains('open')) load(true, true); }, C.refreshSeconds * 1000);
  }

  // Dữ liệu minh họa: chỉ khi trang mở với ?demo=1 (để thử giao diện, không phải bảng hàng thật).
  function demoData() {
    var dirs = ['Đông Bắc', 'Tây Bắc', 'Tây', 'Tây Nam', 'Đông Nam', 'Nam'], st = ['Còn hàng', 'Còn hàng', 'Đang giữ chỗ', 'Còn hàng', 'Còn hàng', 'Đang giữ chỗ'];
    function gen(defs) {
      var out = [];
      defs.forEach(function (d) {
        for (var i = 1; i <= d[4]; i++) {
          var land = d[3] + (i % 3) * 5;
          out.push({ code: d[1] + '-' + ('0' + i * 2).slice(-2), zone: d[0], street: d[1], type: d[2], direction: dirs[(i + d[1].length) % 6], handover: 'Thô',
            land: land, build: Math.round(land * 2.7 * 10) / 10, price: Math.round((d[5] + (i % 5) * 0.21e9) / 1e7) * 1e7, status: st[(i * 5 + d[1].length) % 6] });
        }
      });
      return out;
    }
    return { ok: true, updatedAt: new Date().toISOString(), projects: [
      { id: 'VHSGP', name: 'Vinhomes Saigon Park', units: gen([['Ivy Park', 'AS76', 'LK', 50, 8, 5.8e9], ['Global Park', 'TL12A', 'LK', 50, 8, 5.9e9], ['Ivy Park', 'AS85', 'LK', 60, 6, 6.5e9], ['Global Park', 'ĐLCV2', 'SL', 112, 5, 17.2e9]]) },
      { id: 'VHCG', name: 'Vinhomes Green Paradise', units: gen([['Vịnh Ngọc', 'AS24', 'SL', 280, 6, 31.2e9], ['Vịnh Ngọc', 'TĐX', 'SL', 180, 6, 45.1e9], ['Vịnh Tiên', 'VT44', 'LK', 80, 8, 14.9e9]]) }
    ] };
  }

  function init() { Array.prototype.forEach.call(document.querySelectorAll('[data-adl-bang-hang]'), mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.ADLBangHang = { mount: mount, refresh: init };
})();
