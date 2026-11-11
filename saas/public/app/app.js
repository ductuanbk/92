/* Giao diện quản lý ADL Giỏ Hàng: ứng dụng một trang, không dùng thư viện ngoài. */
(function () {
  'use strict';

  // ─── Tiện ích ───
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n, d = 0) => (n == null || n === '' ? '' : Number(n).toLocaleString('vi-VN', { maximumFractionDigits: d }));
  const ty = (n) => (n ? num(n / 1e9, 2) + ' tỷ' : '—');
  const m2 = (n) => (n == null ? '—' : num(n, 1) + ' m²');
  const perM2 = (u) => (u.price && u.land ? num(u.price / u.land / 1e6, 1) + ' tr/m²' : '—');
  const toDate = (s) => (s ? new Date(/Z|[+-]\d\d:\d\d$/.test(s) ? s : s.replace(' ', 'T') + 'Z') : null);
  const dt = (s) => { const d = toDate(s); return d ? d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''; };
  const day = (s) => { const d = toDate(s); return d ? d.toLocaleDateString('vi-VN') : ''; };
  const ago = (s) => {
    const d = toDate(s); if (!d) return '';
    const m = Math.round((Date.now() - d) / 60000);
    if (m < 1) return 'vừa xong'; if (m < 60) return m + ' phút trước'; if (m < 1440) return Math.round(m / 60) + ' giờ trước';
    if (m < 10080) return Math.round(m / 1440) + ' ngày trước'; return day(s);
  };
  const STATUSES = ['Còn hàng', 'Check admin', 'Đang lock', 'Đã cọc', 'Đã bán'];
  const sCls = (s) => 's-' + Math.max(0, STATUSES.indexOf(s));
  const stt = (s) => `<span class="stt ${sCls(s)}">${esc(s)}</span>`;
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();

  const ICON = {
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', sync: '<path d="M20 11a8 8 0 0 0-14.9-4M4 13a8 8 0 0 0 14.9 4"/><path d="M4 4v5h5M20 20v-5h-5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };
  const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON[n] || ''}</svg>`;

  function toast(msg, bad) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(t._h); t._h = setTimeout(() => { t.className = 'toast'; }, 3200);
  }
  async function api(method, path, body) {
    let res;
    try {
      res = await fetch(path, { method, credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-gh': '1' }, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch { throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'); }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !path.startsWith('/api/auth/')) { S.me = null; go('/dang-nhap'); }
    if (!res.ok) { const e = new Error(data.error || 'Có lỗi xảy ra.'); e.status = res.status; throw e; }
    return data;
  }
  const GET = (p) => api('GET', p), POST = (p, b) => api('POST', p, b || {}), PUT = (p, b) => api('PUT', p, b || {}), DEL = (p, b) => api('DELETE', p, b || {});
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg || 'Đã sao chép'); }
    catch { const a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); toast(msg || 'Đã sao chép'); } catch { toast('Không sao chép được, vui lòng chọn và sao chép thủ công', true); } a.remove(); }
  }
  // Gắn xử lý cho nút có data-act trong một vùng.
  function on(root, handlers) {
    root.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (!el || !root.contains(el)) return;
      const fn = handlers[el.dataset.act];
      if (fn) { e.preventDefault(); fn(el, e); }
    });
  }
  // Nút đang chạy: khóa và đổi chữ cho tới khi xong.
  async function busy(btn, fn) {
    if (btn.disabled) return;
    const txt = btn.innerHTML; btn.disabled = true; btn.textContent = 'Đang xử lý...';
    try { return await fn(); } catch (e) { toast(e.message, true); } finally { btn.disabled = false; btn.innerHTML = txt; }
  }
  const formData = (form) => {
    const o = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else o[el.name] = el.value;
    }
    return o;
  };

  // ─── Trạng thái chung, định tuyến ───
  const S = { me: null, projects: [], route: '' };
  const isAdmin = () => S.me && ['owner', 'admin'].includes(S.me.role);
  const isOwner = () => S.me && S.me.role === 'owner';
  const go = (path) => { if (location.hash !== '#' + path) location.hash = path; else route(); };
  window.addEventListener('hashchange', route);

  async function boot() {
    try { S.me = await GET('/api/me'); } catch (e) { $('#root').innerHTML = `<div class="loading">${esc(e.message)}</div>`; return; }
    document.title = S.me.product.name;
    route();
  }
  async function refreshMe() { S.me = await GET('/api/me'); }

  async function route() {
    const h = location.hash.replace(/^#/, '') || '/';
    const parts = h.split('/').filter(Boolean);
    const pub = { 'dang-nhap': viewLogin, 'dang-ky': viewSignup, moi: viewInvite, 'dat-lai-mat-khau': viewReset };
    if (pub[parts[0]]) return pub[parts[0]](parts[1]);
    if (!S.me || !S.me.user) return go(location.search.includes('dang-ky') ? '/dang-ky' : '/dang-nhap');
    if (!S.me.workspace) return viewNoWorkspace();
    const views = {
      '': viewDashboard, 'du-an': viewProject, 'giu-can': viewHolds, 'bien-dong': viewEvents, 'thanh-vien': viewTeam,
      'bang-hang': viewPublic, 'thanh-toan': viewBilling, 'tai-khoan': viewAccount, 'quan-tri': viewAdmin
    };
    const fn = views[parts[0] || ''] || viewDashboard;
    S.route = parts[0] || '';
    try { S.projects = (await GET('/api/projects')).projects; } catch (e) { if (e.status !== 401) toast(e.message, true); return; }
    shell();
    const box = $('#content');
    box.innerHTML = '<div class="loading">Đang tải...</div>';
    try { await fn(box, parts[1]); } catch (e) { if (e.status !== 401) box.innerHTML = `<div class="card empty"><b>Không tải được trang</b>${esc(e.message)}</div>`; }
    window.scrollTo(0, 0);
  }

  // ─── Khung giao diện ───
  function shell() {
    const me = S.me, ws = me.workspace, sub = ws.subscription;
    const navItem = (path, icon, label, extra = '') => `<a href="#/${path}" class="${S.route === path.split('/')[0] && (path.split('/')[1] || '') === (location.hash.split('/')[2] || '') ? 'on' : ''}">${ic(icon)}<span>${label}</span>${extra}</a>`;
    const projectLinks = S.projects.map((p) => `<a class="sub ${S.route === 'du-an' && location.hash.split('/')[2] === String(p.id) ? 'on' : ''}" href="#/du-an/${p.id}">${esc(p.name)}</a>`).join('');
    const daysLeft = sub.endsAt ? Math.ceil((new Date(sub.endsAt) - Date.now()) / 86400000) : null;
    let banner = '';
    if (!sub.active) banner = `<div class="banner bad"><b>Gói dịch vụ đã hết hạn.</b> Dữ liệu vẫn xem được nhưng không cập nhật được${sub.publicActive ? '; bảng hàng công khai sẽ tạm ngưng sau vài ngày' : ', bảng hàng công khai đang tạm ngưng'}. ${isOwner() ? '<a href="#/thanh-toan">Gia hạn ngay</a>' : 'Vui lòng báo chủ tài khoản gia hạn.'}</div>`;
    else if (sub.plan === 'trial') banner = `<div class="banner">Đang dùng thử, còn <b>${Math.max(daysLeft, 0)} ngày</b>. ${isOwner() ? '<a href="#/thanh-toan">Chọn gói để dùng tiếp</a>' : ''}</div>`;
    else if (daysLeft != null && daysLeft <= 7) banner = `<div class="banner">Gói ${esc(sub.planName)} hết hạn sau <b>${daysLeft} ngày</b>. ${isOwner() ? '<a href="#/thanh-toan">Gia hạn</a>' : ''}</div>`;
    const wsSwitch = me.workspaces.length > 1 ? `<select id="wsSel">${me.workspaces.map((w) => `<option value="${w.id}" ${w.id === ws.id ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select>` : '';
    $('#root').innerHTML = `<div class="shell" id="shell">
      <aside class="side">
        <div class="brand"><i>GH</i>${esc(me.product.name)}</div>
        <div class="wsbox"><b>${esc(ws.name)}</b><span class="small" style="opacity:.7">${esc(me.roleName)} · Gói ${esc(sub.planName)}</span>${wsSwitch}</div>
        <nav class="nav">
          ${navItem('', 'home', 'Tổng quan')}
          <h6>Dự án</h6>${projectLinks || '<span class="small" style="opacity:.55;padding:4px 10px">Chưa có dự án</span>'}
          ${isAdmin() ? `<a href="#" data-act="newProject">${ic('plus')}<span>Thêm dự án</span></a>` : ''}
          <h6>Vận hành</h6>
          ${navItem('giu-can', 'lock', 'Giữ căn', me.pendingHolds ? `<span class="badge">${me.pendingHolds}</span>` : '')}
          ${navItem('bien-dong', 'pulse', 'Biến động')}
          ${navItem('thanh-vien', 'users', 'Thành viên')}
          ${isAdmin() ? navItem('bang-hang', 'globe', 'Bảng hàng công khai') : ''}
          ${navItem('thanh-toan', 'card', 'Gói dịch vụ')}
          ${me.user.superadmin ? `<h6>Hệ thống</h6>${navItem('quan-tri', 'shield', 'Quản trị hệ thống')}` : ''}
        </nav>
        <div class="me"><b>${esc(me.user.name)}</b><span class="small" style="opacity:.6">${esc(me.user.email)}</span><div style="margin-top:6px"><a href="#/tai-khoan">Tài khoản</a><a href="#" data-act="logout">Đăng xuất</a></div></div>
      </aside>
      <div class="main">
        <div class="topbar"><button data-act="menu" aria-label="Mở menu">☰</button><b>${esc(ws.name)}</b></div>
        ${banner}
        <div class="content" id="content"></div>
      </div>
    </div>`;
    const sh = $('#shell');
    on(sh, {
      menu: () => sh.classList.toggle('menu'),
      logout: async () => { await POST('/api/auth/logout'); S.me = await GET('/api/me'); go('/dang-nhap'); },
      newProject: () => projectModal()
    });
    $$('.side a[href]', sh).forEach((a) => a.addEventListener('click', () => sh.classList.remove('menu')));
    const sel = $('#wsSel');
    if (sel) sel.addEventListener('change', async () => { await POST('/api/me/workspace', { id: Number(sel.value) }); await refreshMe(); go('/'); });
  }

  function modal(html, { wide = false, drawer = false } = {}) {
    const ov = document.createElement('div');
    ov.className = 'overlay' + (drawer ? '' : ' center');
    ov.innerHTML = drawer ? `<div class="drawer">${html}</div>` : `<div class="modal${wide ? ' wide' : ''}">${html}</div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); document.removeEventListener('keydown', esc_); };
    const esc_ = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc_);
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    on(ov, { close });
    const first = ov.querySelector('input:not([type=hidden]):not([type=checkbox]), select, textarea');
    if (first) setTimeout(() => first.focus(), 30);
    return { el: ov, close };
  }

  // ─── Đăng nhập, đăng ký ───
  function authPage(title, formHtml) {
    const p = S.me ? S.me.product : { name: 'ADL Giỏ Hàng', tagline: '' };
    $('#root').innerHTML = `<div class="auth">
      <div class="art"><a href="/" style="color:#fff;font-weight:800;font-size:18px">${esc(p.name)}</a>
        <h1>Giỏ hàng bất động sản luôn đúng, cả đội cùng xem một bảng.</h1>
        <p>Cập nhật tình trạng căn, duyệt giữ căn, đăng bảng hàng lên website chỉ trong vài phút. Nhập thẳng từ Excel hoặc Google Sheet đang dùng.</p>
        <ul><li>Dùng thử miễn phí 14 ngày, không cần thẻ</li><li>Nhân viên kinh doanh xin giữ căn, quản trị duyệt một chạm</li><li>Bảng hàng công khai mang thương hiệu của bạn</li></ul></div>
      <div class="box">${formHtml}</div></div>`;
    document.title = title + ' · ' + p.name;
  }
  function bindForm(form, fn) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]'), err = form.querySelector('.err');
      if (err) err.textContent = '';
      await busy(btn, async () => { try { await fn(formData(form)); } catch (x) { if (err) err.textContent = x.message; else throw x; } });
    });
  }
  function viewLogin() {
    if (S.me && S.me.user) return go('/');
    authPage('Đăng nhập', `<form id="f"><h2>Đăng nhập</h2>
      <label class="f">Email<input class="in" name="email" type="email" autocomplete="email" required></label>
      <label class="f">Mật khẩu<input class="in" name="password" type="password" autocomplete="current-password" required></label>
      <div class="err"></div><button class="btn red" type="submit">Đăng nhập</button>
      <p class="muted small">Chưa có tài khoản? <a href="#/dang-ky">Đăng ký dùng thử miễn phí</a><br>Quên mật khẩu? Nhờ quản trị đơn vị tạo link đặt lại trong mục Thành viên.</p></form>`);
    bindForm($('#f'), async (d) => { await POST('/api/auth/login', d); await refreshMe(); go('/'); });
  }
  function viewSignup() {
    if (S.me && S.me.user) return go('/');
    authPage('Đăng ký', `<form id="f"><h2>Dùng thử miễn phí 14 ngày</h2>
      <label class="f">Tên sàn / đại lý<input class="in" name="company" required maxlength="120" placeholder="Ví dụ: Công ty CP BĐS An Phát"></label>
      <div class="form two"><label class="f">Họ tên<input class="in" name="name" required maxlength="80"></label>
      <label class="f">Số điện thoại<input class="in" name="phone" required inputmode="tel"></label></div>
      <label class="f">Email đăng nhập<input class="in" name="email" type="email" autocomplete="email" required></label>
      <label class="f">Mật khẩu <small>(ít nhất 8 ký tự)</small><input class="in" name="password" type="password" autocomplete="new-password" minlength="8" required></label>
      <label class="check"><input type="checkbox" name="agree" required> Tôi đồng ý <a href="/dieu-khoan" target="_blank">Điều khoản sử dụng</a> và <a href="/bao-mat" target="_blank">Chính sách bảo mật</a></label>
      <div class="err"></div><button class="btn red" type="submit">Tạo tài khoản</button>
      <p class="muted small">Đã có tài khoản? <a href="#/dang-nhap">Đăng nhập</a></p></form>`);
    bindForm($('#f'), async (d) => { await POST('/api/auth/signup', d); await refreshMe(); go('/'); });
  }
  async function viewInvite(token) {
    let inv;
    try { inv = await GET('/api/invites/' + encodeURIComponent(token)); } catch (e) { return authPage('Lời mời', `<div class="card card-b"><h2>Link mời không dùng được</h2><p>${esc(e.message)}</p><a class="btn" href="#/dang-nhap">Đăng nhập</a></div>`); }
    const head = `<h2>Tham gia ${esc(inv.workspace)}</h2><p class="muted">Bạn được mời với vai trò <b>${esc(inv.roleName)}</b>.</p>`;
    if (inv.loggedIn) {
      authPage('Lời mời', `<form id="f">${head}<p>Đang đăng nhập bằng <b>${esc(inv.email)}</b>.</p><div class="err"></div><button class="btn red" type="submit">Nhận lời mời</button></form>`);
    } else {
      authPage('Lời mời', `<form id="f">${head}
        <label class="f">Họ tên<input class="in" name="name" required maxlength="80"></label>
        <label class="f">Số điện thoại<input class="in" name="phone" inputmode="tel"></label>
        <label class="f">Email<input class="in" name="email" type="email" required></label>
        <label class="f">Mật khẩu <small>(tạo mới, hoặc mật khẩu tài khoản sẵn có của email này)</small><input class="in" name="password" type="password" minlength="8" required></label>
        <div class="err"></div><button class="btn red" type="submit">Tham gia</button></form>`);
    }
    bindForm($('#f'), async (d) => { await POST('/api/invites/' + encodeURIComponent(token) + '/accept', d); await refreshMe(); toast('Đã tham gia ' + inv.workspace); go('/'); });
  }
  function viewReset(token) {
    authPage('Đặt lại mật khẩu', `<form id="f"><h2>Đặt mật khẩu mới</h2>
      <label class="f">Mật khẩu mới <small>(ít nhất 8 ký tự)</small><input class="in" name="password" type="password" minlength="8" required autocomplete="new-password"></label>
      <div class="err"></div><button class="btn red" type="submit">Lưu mật khẩu</button></form>`);
    bindForm($('#f'), async (d) => { await POST('/api/reset/' + encodeURIComponent(token), d); toast('Đã đổi mật khẩu, vui lòng đăng nhập'); S.me = await GET('/api/me'); go('/dang-nhap'); });
  }
  function viewNoWorkspace() {
    authPage('Chưa có đơn vị', `<div><h2>Tài khoản chưa thuộc đơn vị nào</h2><p class="muted">Bạn đã bị gỡ khỏi đơn vị trước đó. Nhờ quản trị gửi link mời mới, hoặc đăng ký đơn vị riêng.</p>
      <button class="btn ghost" id="lo">Đăng xuất</button></div>`);
    $('#lo').onclick = async () => { await POST('/api/auth/logout'); S.me = await GET('/api/me'); go('/dang-ky'); };
  }

  // ─── Tổng quan ───
  async function viewDashboard(box) {
    const [ev, holds, wsInfo] = await Promise.all([GET('/api/events'), GET('/api/holds'), GET('/api/workspace')]);
    const P = S.projects, tot = (k) => P.reduce((a, p) => a + (k ? p.byStatus[k] || 0 : p.total), 0);
    const pending = holds.holds.filter((h) => h.status === 'pending');
    const steps = [
      [P.length > 0, 'Tạo dự án đầu tiên', isAdmin() ? '<button class="btn sm" data-act="newProject">Tạo dự án</button>' : ''],
      [tot() > 0, 'Nhập giỏ hàng từ Excel hoặc Google Sheet', P[0] ? `<a class="btn sm ghost" href="#/du-an/${P[0].id}">Mở dự án</a>` : ''],
      [wsInfo.usage.members > 1, 'Mời nhân viên kinh doanh', '<a class="btn sm ghost" href="#/thanh-vien">Mời</a>'],
      [!!wsInfo.workspace.hotline && !!wsInfo.workspace.zalo, 'Cài đặt bảng hàng công khai (hotline, Zalo, màu)', isAdmin() ? '<a class="btn sm ghost" href="#/bang-hang">Cài đặt</a>' : '']
    ];
    const allDone = steps.every((s) => s[0]);
    box.innerHTML = `<div class="page-h"><div><h1>Tổng quan</h1><p>${esc(S.me.workspace.name)} · cập nhật ${dt(new Date().toISOString())}</p></div><span class="sp"></span>
      <a class="btn ghost" href="${esc(wsInfo.publicUrl)}" target="_blank" rel="noopener">${ic('ext')}Xem bảng hàng công khai</a></div>
      ${allDone ? '' : `<div class="card card-b" style="margin-bottom:16px"><h3 style="margin-bottom:12px">Bắt đầu trong 4 bước</h3><div class="steps">${steps.map(([d, t, a]) => `<div class="${d ? 'done' : ''}"><span class="sp">${t}</span>${d ? '' : a}</div>`).join('')}</div></div>`}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><span>Tổng số căn</span><b>${num(tot())}</b></div>
        <div class="card kpi ok"><span>Còn hàng</span><b>${num(tot('Còn hàng'))}</b></div>
        <div class="card kpi hold"><span>Đang giữ, chờ duyệt</span><b>${num(tot('Check admin') + tot('Đang lock') + tot('Đã cọc'))}</b></div>
        <div class="card kpi sold"><span>Đã bán</span><b>${num(tot('Đã bán'))}</b></div>
      </div>
      <div class="grid g2">
        <div class="stack">
          ${P.map((p) => projectCard(p)).join('') || `<div class="card empty"><b>Chưa có dự án</b>${isAdmin() ? 'Bấm "Thêm dự án" để bắt đầu.' : 'Quản trị chưa tạo dự án.'}</div>`}
        </div>
        <div class="stack">
          ${isAdmin() ? `<div class="card"><div class="card-h"><h3>Yêu cầu giữ căn chờ duyệt</h3><span class="sp"></span><a href="#/giu-can" class="small">Tất cả</a></div>
            <div class="list">${pending.slice(0, 6).map((h) => `<div><div class="sp"><b>${esc(h.code)}</b> <span class="muted">· ${esc(h.project)}</span><br><span class="small">${esc(h.requester)}${h.customer ? ' cho khách ' + esc(h.customer) : ''} · ${ago(h.createdAt)}</span></div><a class="btn sm" href="#/giu-can">Duyệt</a></div>`).join('') || '<div class="muted">Không có yêu cầu nào.</div>'}</div></div>` : ''}
          <div class="card"><div class="card-h"><h3>Biến động gần đây</h3><span class="sp"></span><a href="#/bien-dong" class="small">Xem tất cả</a></div>
            <div class="list">${ev.events.slice(0, 8).map(eventRow).join('') || '<div class="muted">Chưa có biến động.</div>'}</div></div>
        </div>
      </div>`;
    on(box, { newProject: () => projectModal() });
    $$('.pcard', box).forEach((el) => el.addEventListener('click', () => go('/du-an/' + el.dataset.id)));
  }
  function statusBar(p) {
    return `<div class="bar">${STATUSES.map((s) => (p.byStatus[s] ? `<i class="${sCls(s)}" style="width:${(p.byStatus[s] / p.total) * 100}%" title="${s}: ${p.byStatus[s]}"></i>` : '')).join('')}</div>`;
  }
  function projectCard(p) {
    return `<div class="card pcard" data-id="${p.id}"><div class="row"><h3>${esc(p.name)}</h3><span class="sp"></span>${p.isPublic ? '<span class="tag">Công khai</span>' : '<span class="tag">Nội bộ</span>'}${p.sheetUrl ? ' <span class="tag gold">Google Sheet</span>' : ''}</div>
      ${p.total ? statusBar(p) : ''}
      <div class="legend">${p.total ? STATUSES.filter((s) => p.byStatus[s]).map((s) => `<span><i class="${sCls(s)}" style="background:var(--c)"></i>${s}: <b>${p.byStatus[s]}</b></span>`).join('') : '<span class="muted">Chưa có căn. Mở dự án để nhập dữ liệu.</span>'}</div></div>`;
  }
  const EV_IC = { status: ['status', 'TT'], price: ['price', '₫'], create: ['create', '+'], delete: ['delete', '−'], import: ['create', '↑'], hold_request: ['hold', 'G'], hold_approve: ['hold', '✓'], hold_reject: ['delete', '✕'], hold_release: ['hold', '↩'], hold_expire: ['hold', '⏱'], update: ['', '✎'] };
  function eventRow(e) {
    const [cls, t] = EV_IC[e.type] || ['', '•'];
    return `<div><span class="ev-ic ${cls}">${t}</span><div class="sp"><div>${e.code ? `<b>${esc(e.code)}</b> ` : ''}${esc(e.detail)}</div>
      <div class="small muted">${e.project ? esc(e.project) + ' · ' : ''}${e.user ? esc(e.user) : 'Hệ thống'} · ${ago(e.at)}</div></div></div>`;
  }

  // ─── Dự án: bảng giỏ hàng ───
  async function viewProject(box, id) {
    const p = S.projects.find((x) => String(x.id) === String(id));
    if (!p) { box.innerHTML = '<div class="card empty"><b>Không tìm thấy dự án</b></div>'; return; }
    const data = await GET(`/api/projects/${p.id}/units`);
    const st = { units: data.units, q: '', status: '', type: '', zone: '', price: '', sort: 'code', dir: 1, sel: new Set(), shown: 200 };
    const admin = isAdmin();
    const PRICE = [[0, 5, 'Dưới 5 tỷ'], [5, 10, '5 đến 10 tỷ'], [10, 20, '10 đến 20 tỷ'], [20, 1e9, 'Trên 20 tỷ']];
    const opts = (k) => [...new Set(st.units.map((u) => u[k]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
    box.innerHTML = `<div class="page-h"><div><h1>${esc(p.name)}</h1><p>${num(p.total)} căn${p.sheetUrl ? ` · Đồng bộ Google Sheet ${p.sheetSyncedAt ? ago(p.sheetSyncedAt) : 'chưa chạy'}${p.sheetError ? ` · <span style="color:var(--danger)">${esc(p.sheetError)}</span>` : ''}` : ''}</p></div><span class="sp"></span>
      ${admin ? `${p.sheetUrl ? `<button class="btn ghost" data-act="sync">${ic('sync')}Đồng bộ ngay</button>` : ''}<button class="btn ghost" data-act="import">${ic('upload')}Nhập dữ liệu</button><button class="btn" data-act="add">${ic('plus')}Thêm căn</button><button class="btn ghost" data-act="settings" title="Cài đặt dự án">${ic('gear')}</button>` : ''}</div>
      <div class="card">
        <div class="tools">
          <input class="in search" id="q" type="search" placeholder="Tìm mã căn, ghi chú, đối tác...">
          <select class="in" id="fType"><option value="">Loại hình: tất cả</option>${opts('type').map((v) => `<option>${esc(v)}</option>`).join('')}</select>
          ${opts('zone').length ? `<select class="in" id="fZone"><option value="">Phân khu: tất cả</option>${opts('zone').map((v) => `<option>${esc(v)}</option>`).join('')}</select>` : ''}
          <select class="in" id="fPrice"><option value="">Giá: tất cả</option>${PRICE.map((b, i) => `<option value="${i}">${b[2]}</option>`).join('')}</select>
          <button class="btn ghost sm" data-act="csv" title="Tải danh sách đang lọc">Tải CSV</button>
        </div>
        <div class="chips" id="chips"></div>
        <div class="tbl-wrap"><table class="t"><thead><tr id="th"></tr></thead><tbody id="tb"></tbody></table></div>
        <div id="more" style="padding:12px;text-align:center" hidden><button class="btn ghost sm" data-act="more">Xem thêm</button></div>
      </div>
      <div class="bulk" id="bulk" hidden><b id="bulkN"></b><select id="bulkS">${STATUSES.map((s) => `<option>${s}</option>`).join('')}</select>
        <button class="btn sm red" data-act="bulkSet">Đổi tình trạng</button><button class="btn sm danger" data-act="bulkDel">Xóa</button><button class="btn sm ghost" data-act="bulkClear">Bỏ chọn</button></div>`;
    const COLS = [
      ...(admin ? [{ k: '_sel', l: '<input type="checkbox" id="selAll" aria-label="Chọn tất cả">' }] : []),
      { k: 'code', l: 'Mã căn', s: true }, { k: 'type', l: 'Loại hình', s: true, cls: 'hide-m' }, { k: 'zone', l: 'Phân khu / Dãy', cls: 'hide-m' },
      { k: 'land', l: 'DT đất', s: true, num: 1, cls: 'hide-m' }, { k: 'build', l: 'DT XD', s: true, num: 1, cls: 'hide-m' }, { k: 'price', l: 'Giá niêm yết', s: true, num: 1 },
      { k: 'perM2', l: 'Đơn giá', num: 1, cls: 'hide-m' }, { k: 'status', l: 'Tình trạng', s: true }, { k: 'hold', l: 'Giữ căn', cls: 'hide-m' }, { k: 'updatedAt', l: 'Cập nhật', s: true, cls: 'hide-m' }
    ];
    const filtered = () => {
      const q = norm(st.q);
      return st.units.filter((u) => (!q || norm(u.code + ' ' + u.note + ' ' + u.partner + ' ' + u.type).includes(q)) && (!st.status || u.status === st.status) &&
        (!st.type || u.type === st.type) && (!st.zone || u.zone === st.zone) && (st.price === '' || (u.price >= PRICE[st.price][0] * 1e9 && u.price < PRICE[st.price][1] * 1e9)));
    };
    const sorted = (list) => list.slice().sort((a, b) => {
      const x = a[st.sort], y = b[st.sort];
      const r = st.sort === 'status' ? STATUSES.indexOf(x) - STATUSES.indexOf(y) : typeof x === 'number' || typeof y === 'number' ? (x ?? -1) - (y ?? -1) : String(x || '').localeCompare(String(y || ''), 'vi', { numeric: true });
      return r * st.dir;
    });
    function render() {
      // Số căn từng tình trạng theo các lọc còn lại (không tính lọc tình trạng).
      const counts = {}; const pre = (() => { const s = st.status; st.status = ''; const l = filtered(); st.status = s; return l; })();
      pre.forEach((u) => { counts[u.status] = (counts[u.status] || 0) + 1; });
      $('#chips').innerHTML = `<button class="chip ${st.status ? '' : 'on'}" data-act="chip" data-v="">Tất cả <b>${pre.length}</b></button>` +
        STATUSES.filter((s) => counts[s]).map((s) => `<button class="chip ${st.status === s ? 'on' : ''}" data-act="chip" data-v="${s}">${s} <b>${counts[s]}</b></button>`).join('');
      $('#th').innerHTML = COLS.map((c) => `<th class="${c.num ? 'num ' : ''}${c.s ? 'sortable ' : ''}${c.cls || ''}" ${c.s ? `data-act="sort" data-k="${c.k}"` : ''}>${c.l}${st.sort === c.k ? (st.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('');
      const list = sorted(filtered()), shown = list.slice(0, st.shown);
      $('#tb').innerHTML = shown.map((u) => `<tr data-id="${u.id}" class="${st.sel.has(u.id) ? 'sel' : ''}">
        ${admin ? `<td><input type="checkbox" data-sel="${u.id}" ${st.sel.has(u.id) ? 'checked' : ''} aria-label="Chọn ${esc(u.code)}"></td>` : ''}
        <td class="ucode"><b>${esc(u.code)}</b>${u.exclusive ? ' <span class="tag dq">ĐQ</span>' : ''}</td><td class="hide-m">${esc(u.type)}</td><td class="hide-m">${esc([u.zone, u.street].filter(Boolean).join(' · '))}</td>
        <td class="num hide-m">${m2(u.land)}</td><td class="num hide-m">${m2(u.build)}</td><td class="num"><b>${ty(u.price)}</b></td><td class="num hide-m">${perM2(u)}</td>
        <td>${stt(u.status)}</td><td class="hide-m small">${u.hold ? `${u.hold.status === 'pending' ? 'Chờ duyệt' : 'Giữ đến ' + dt(u.hold.expiresAt)} · ${esc(u.hold.requester)}` : ''}</td>
        <td class="hide-m small muted">${ago(u.updatedAt)}</td></tr>`).join('') ||
        `<tr><td colspan="${COLS.length}"><div class="empty"><b>${st.units.length ? 'Không có căn phù hợp' : 'Dự án chưa có căn'}</b>${st.units.length ? 'Thử bỏ bớt bộ lọc.' : admin ? 'Bấm "Nhập dữ liệu" để dán bảng từ Excel hoặc gắn Google Sheet.' : ''}</div></td></tr>`;
      $('#more').hidden = list.length <= st.shown;
      const sa = $('#selAll'); if (sa) sa.checked = shown.length > 0 && shown.every((u) => st.sel.has(u.id));
      $('#bulk').hidden = !st.sel.size; $('#bulkN').textContent = `Đã chọn ${st.sel.size} căn`;
    }
    const reload = async () => { st.units = (await GET(`/api/projects/${p.id}/units`)).units; st.sel.clear(); render(); S.projects = (await GET('/api/projects')).projects; };
    render();
    $('#q').addEventListener('input', (e) => { st.q = e.target.value; render(); });
    $('#fType').addEventListener('change', (e) => { st.type = e.target.value; render(); });
    if ($('#fZone')) $('#fZone').addEventListener('change', (e) => { st.zone = e.target.value; render(); });
    $('#fPrice').addEventListener('change', (e) => { st.price = e.target.value; render(); });
    $('#tb').addEventListener('click', (e) => {
      const cb = e.target.closest('[data-sel]');
      if (cb) { const id = Number(cb.dataset.sel); if (cb.checked) st.sel.add(id); else st.sel.delete(id); render(); return; }
      const tr = e.target.closest('tr[data-id]');
      if (tr) unitDrawer(p, st.units.find((u) => u.id === Number(tr.dataset.id)), reload);
    });
    box.addEventListener('change', (e) => {
      if (e.target.id === 'selAll') { const list = sorted(filtered()).slice(0, st.shown); list.forEach((u) => (e.target.checked ? st.sel.add(u.id) : st.sel.delete(u.id))); render(); }
    });
    on(box, {
      chip: (el) => { st.status = el.dataset.v; render(); },
      sort: (el) => { if (st.sort === el.dataset.k) st.dir = -st.dir; else { st.sort = el.dataset.k; st.dir = ['price', 'land', 'build', 'updatedAt'].includes(el.dataset.k) ? -1 : 1; } render(); },
      more: () => { st.shown += 300; render(); },
      add: () => unitDrawer(p, null, reload),
      import: () => importModal(p, reload),
      settings: () => projectModal(p),
      sync: (el) => busy(el, async () => { const r = await POST(`/api/projects/${p.id}/sync`); toast(`Đồng bộ xong: ${r.created} mới, ${r.updated} cập nhật, ${r.removed} gỡ bỏ`); await reload(); }),
      csv: () => downloadCsv(p.name, sorted(filtered()), admin),
      bulkClear: () => { st.sel.clear(); render(); },
      bulkSet: (el) => busy(el, async () => { const r = await POST(`/api/projects/${p.id}/bulk`, { ids: [...st.sel], status: $('#bulkS').value }); toast(`Đã đổi ${r.count} căn`); await reload(); }),
      bulkDel: (el) => { if (confirm(`Xóa ${st.sel.size} căn đã chọn? Không hoàn tác được.`)) busy(el, async () => { const r = await POST(`/api/projects/${p.id}/bulk`, { ids: [...st.sel], action: 'delete' }); toast(`Đã xóa ${r.count} căn`); await reload(); }); }
    });
  }
  function downloadCsv(name, list, admin) {
    const cols = [['code', 'Mã căn'], ['zone', 'Phân khu'], ['street', 'Dãy'], ['type', 'Loại căn'], ['direction', 'Hướng'], ['handover', 'TCBG'], ['land', 'DT đất'], ['build', 'DTXD'],
      ['price', 'Giá gồm VAT và KPBT'], ['priceExVat', 'Giá chưa gồm VAT'], ['priceLoan', 'Giá vay'], ['priceEarly', 'Giá TTS'], ['priceProgress', 'Giá TTTĐ'], ['fund', 'Quỹ căn'], ['status', 'Tình trạng'],
      ['ptg', 'Link PTG'], ['unitLink', 'Chỉ căn'], ...(admin ? [['note', 'Ghi chú'], ['partner', 'Đối tác']] : [])];
    const q = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csv = '\uFEFF' + [cols.map((c) => c[1]).join(','), ...list.map((u) => cols.map((c) => q(u[c[0]])).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `gio-hang-${norm(name).replace(/[^a-z0-9]+/g, '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ─── Ngăn kéo chi tiết căn ───
  const F = [
    ['code', 'Mã căn', 'text'], ['type', 'Loại hình', 'text'], ['zone', 'Phân khu', 'text'], ['street', 'Dãy / đường', 'text'], ['direction', 'Hướng', 'text'], ['handover', 'Tiêu chuẩn bàn giao', 'text'],
    ['land', 'DT đất (m²)', 'num'], ['build', 'DT xây dựng (m²)', 'num'], ['fund', 'Quỹ căn (Sơ cấp / Thứ cấp)', 'text'],
    ['price', 'Giá niêm yết, gồm VAT và KPBT (đồng)', 'money'], ['priceExVat', 'Giá chưa VAT (đồng)', 'money'], ['priceLoan', 'Giá vay (đồng)', 'money'],
    ['priceEarly', 'Giá TTS (đồng)', 'money'], ['priceProgress', 'Giá TTTĐ (đồng)', 'money'], ['ptg', 'Link phiếu tính giá', 'url'], ['unitLink', 'Link ảnh chỉ căn', 'url'],
    ['partner', 'Đối tác (nội bộ)', 'text'], ['note', 'Ghi chú (nội bộ)', 'area']
  ];
  function unitDrawer(p, u, reload) {
    const admin = isAdmin(), isNew = !u;
    u = u || { status: 'Còn hàng' };
    const val = (k) => (u[k] == null ? '' : u[k]);
    const hold = u.hold;
    let holdHtml = '';
    if (hold && hold.status === 'pending') holdHtml = `<div class="hint"><b>Yêu cầu giữ căn chờ duyệt</b><br>${esc(hold.requester)}${hold.customer ? ' cho khách ' + esc(hold.customer) : ''}
      ${admin ? `<div class="row" style="margin-top:10px"><select class="in" id="hHours" style="width:auto">${[2, 6, 12, 24, 48, 72].map((h) => `<option value="${h}" ${h === 24 ? 'selected' : ''}>Giữ ${h} giờ</option>`).join('')}</select>
      <button class="btn sm" data-act="approve">Duyệt</button><button class="btn sm danger" data-act="reject">Từ chối</button></div>` : ''}</div>`;
    else if (hold && hold.status === 'approved') holdHtml = `<div class="hint"><b>Đang giữ đến ${dt(hold.expiresAt)}</b><br>${esc(hold.requester)}${hold.customer ? ' cho khách ' + esc(hold.customer) : ''}
      ${admin ? '<div style="margin-top:10px"><button class="btn sm ghost" data-act="release">Trả căn</button></div>' : ''}</div>`;
    else if (!isNew && u.status === 'Còn hàng') holdHtml = `<form class="hint form" id="holdF"><b>Xin giữ căn</b><div class="form two"><label class="f">Khách hàng<input class="in" name="customer" placeholder="Tên, số điện thoại" maxlength="120"></label>
      <label class="f">Ghi chú<input class="in" name="note" maxlength="300"></label></div><div><button class="btn sm red" type="submit">Gửi yêu cầu giữ căn</button></div></form>`;
    let body;
    if (admin) {
      body = `<form id="uf" class="form">${holdHtml}
        <div class="form two"><label class="f">Tình trạng<select class="in" name="status">${STATUSES.map((s) => `<option ${s === u.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <label class="check" style="margin-top:22px"><input type="checkbox" name="exclusive" ${u.exclusive ? 'checked' : ''}> Giỏ độc quyền (ĐQ)</label></div>
        <div class="form two">${F.map(([k, l, t]) => t === 'area' ? `<label class="f" style="grid-column:1/-1">${l}<textarea class="in" name="${k}" style="min-height:80px;font-family:inherit;font-size:14px">${esc(val(k))}</textarea></label>`
          : `<label class="f" ${t === 'url' ? 'style="grid-column:1/-1"' : ''}>${l}<input class="in" name="${k}" ${t === 'num' || t === 'money' ? 'inputmode="decimal"' : ''} ${t === 'url' ? 'type="url" placeholder="https://..."' : ''} value="${esc(t === 'money' && val(k) !== '' ? num(val(k)) : val(k))}" ${k === 'code' ? 'required' : ''}>${t === 'money' ? '<small class="price-hint"></small>' : ''}</label>`).join('')}</div>
        <div class="err"></div></form>`;
    } else {
      body = `<div class="stack">${holdHtml}<div class="kv">${[['Tình trạng', stt(u.status)], ['Giá niêm yết', ty(u.price)], ['Đơn giá', perM2(u)], ['DT đất', m2(u.land)], ['DT xây dựng', m2(u.build)],
        ['Loại hình', esc(u.type) || '—'], ['Bàn giao', esc(u.handover) || '—'], ['Hướng', esc(u.direction) || '—'], ['Phân khu', esc(u.zone) || '—'], ['Quỹ căn', esc(u.fund) || '—'],
        ['Giá vay', ty(u.priceLoan)], ['Giá TTS', ty(u.priceEarly)], ['Giá TTTĐ', ty(u.priceProgress)]].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>
        <div class="row">${u.ptg ? `<a class="btn ghost sm" href="${esc(u.ptg)}" target="_blank" rel="noopener">Phiếu tính giá ↗</a>` : ''}${u.unitLink ? `<a class="btn ghost sm" href="${esc(u.unitLink)}" target="_blank" rel="noopener">Ảnh chỉ căn ↗</a>` : ''}</div>
        ${u.note ? `<div class="hint"><b>Ghi chú:</b> ${esc(u.note)}</div>` : ''}</div>`;
    }
    const m = modal(`<div class="dh"><div><h2>${isNew ? 'Thêm căn' : esc(u.code)}</h2><span class="muted small">${esc(p.name)}${isNew ? '' : ' · cập nhật ' + ago(u.updatedAt)}</span></div><button class="x" data-act="close" aria-label="Đóng">×</button></div>
      <div class="db">${body}</div>
      ${admin ? `<div class="df"><button class="btn red" data-act="save">${isNew ? 'Thêm căn' : 'Lưu thay đổi'}</button><button class="btn ghost" data-act="close">Đóng</button>
        ${isNew ? '' : '<span class="sp"></span><button class="btn danger" data-act="del">Xóa căn</button>'}</div>` : ''}`, { drawer: true });
    const el = m.el;
    // Gợi ý đọc giá: 10203235501 → 10,2 tỷ
    $$('input[name^=price]', el).forEach((inp) => { const h = () => { const n = Number(inp.value.replace(/[^\d]/g, '')); inp.nextElementSibling.textContent = n ? ty(n) : ''; }; inp.addEventListener('input', h); h(); });
    const done = async (msg) => { m.close(); toast(msg); await reload(); };
    on(el, {
      save: (btn) => busy(btn, async () => {
        const f = $('#uf', el), d = formData(f), out = {};
        for (const [k, , t] of F) out[k] = t === 'money' ? (d[k].replace(/[^\d]/g, '') || null) : t === 'num' ? (d[k].trim() === '' ? null : Number(d[k].replace(',', '.'))) : d[k];
        out.status = d.status; out.exclusive = d.exclusive;
        for (const k of ['land', 'build']) if (out[k] != null && Number.isNaN(out[k])) throw new Error('Diện tích không hợp lệ.');
        if (isNew) await POST(`/api/projects/${p.id}/units`, out); else await PUT(`/api/units/${u.id}`, out);
        await done(isNew ? 'Đã thêm căn ' + out.code : 'Đã lưu ' + out.code);
      }),
      del: (btn) => { if (confirm(`Xóa căn ${u.code}?`)) busy(btn, async () => { await POST(`/api/projects/${p.id}/bulk`, { ids: [u.id], action: 'delete' }); await done('Đã xóa ' + u.code); }); },
      approve: (btn) => busy(btn, async () => { await POST(`/api/holds/${hold.id}/approve`, { hours: Number($('#hHours', el).value) }); await done('Đã duyệt giữ ' + u.code); }),
      reject: (btn) => busy(btn, async () => { const reason = prompt('Lý do từ chối (không bắt buộc):') || ''; await POST(`/api/holds/${hold.id}/reject`, { reason }); await done('Đã từ chối'); }),
      release: (btn) => busy(btn, async () => { await POST(`/api/holds/${hold.id}/release`); await done('Đã trả căn ' + u.code); })
    });
    const hf = $('#holdF', el);
    if (hf) bindForm(hf, async (d) => { await POST(`/api/units/${u.id}/hold`, d); await refreshMe(); await done('Đã gửi yêu cầu giữ ' + u.code); });
  }

  // ─── Nhập dữ liệu ───
  function importModal(p, reload) {
    const sample = 'Mã căn\tLoại căn\tTCBG\tHướng\tDT đất\tDTXD\tGiá gồm VAT và KPBT\tGiá vay\tTình trạng\tGhi chú\tLink PTG\nAS47-16\tLiền kề\tThô\tĐông Bắc\t80\t150,4\t10.203.235.501\t10.466.428.445\tCòn hàng\t\thttps://...';
    const m = modal(`<div class="card-h"><h3>Nhập dữ liệu vào ${esc(p.name)}</h3><button class="x" data-act="close">×</button></div>
      <div class="card-b" style="overflow-y:auto">
        <div class="tabs"><button class="on" data-act="tab" data-t="paste">Dán từ Excel</button><button data-act="tab" data-t="file">File CSV</button><button data-act="tab" data-t="sheet">Google Sheet</button></div>
        <div data-pane="paste"><p class="muted small" style="margin-top:0">Mở file Excel, chọn cả bảng (gồm dòng tiêu đề), bấm Ctrl+C rồi dán vào ô dưới. Phần mềm tự nhận các cột: Mã căn, Loại căn, Phân khu, Hướng, DT đất, DTXD, Giá, Giá vay, Giá TTS, Giá TTTĐ, Tình trạng, Ghi chú, Link PTG, Chỉ căn...</p>
          <textarea class="in" id="txt" placeholder="${esc(sample)}"></textarea></div>
        <div data-pane="file" hidden><p class="muted small" style="margin-top:0">Trong Excel chọn Tệp → Lưu thành → CSV UTF-8. Sau đó chọn file ở đây.</p><input type="file" id="file" accept=".csv,.txt,.tsv,text/csv"> <span id="fname" class="small muted"></span></div>
        <div data-pane="sheet" hidden><p class="muted small" style="margin-top:0">Mở Google Sheet, bấm Chia sẻ → "Bất kỳ ai có đường liên kết" (Người xem), chọn đúng tab giỏ hàng rồi sao chép link trên thanh địa chỉ.</p>
          <input class="in" id="sheet" type="url" placeholder="https://docs.google.com/spreadsheets/d/..." value="${esc(p.sheetUrl || '')}">
          <label class="check" style="margin-top:10px"><input type="checkbox" id="keep" checked> Lưu link để tự đồng bộ mỗi 10 phút (Google Sheet là nguồn chính: căn bị xóa khỏi sheet sẽ bị gỡ khỏi giỏ hàng)</label></div>
        <div style="margin-top:14px" class="row"><button class="btn" data-act="preview">Xem trước</button><span class="err" id="ierr"></span></div>
        <div id="pv"></div>
      </div>`, { wide: true });
    const el = m.el; let tab = 'paste', fileText = '';
    $('#file', el).addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 5 * 1024 * 1024) { toast('File quá lớn (tối đa 5 MB)', true); return; }
      const r = new FileReader(); r.onload = () => { fileText = String(r.result); $('#fname', el).textContent = f.name; }; r.readAsText(f, 'utf-8');
    });
    const source = () => (tab === 'sheet' ? { sheetUrl: $('#sheet', el).value.trim() } : { text: tab === 'file' ? fileText : $('#txt', el).value });
    on(el, {
      tab: (b) => { tab = b.dataset.t; $$('.tabs button', el).forEach((x) => x.classList.toggle('on', x === b)); $$('[data-pane]', el).forEach((x) => { x.hidden = x.dataset.pane !== tab; }); $('#pv', el).innerHTML = ''; },
      preview: (btn) => busy(btn, async () => {
        $('#ierr', el).textContent = '';
        let r;
        try { r = await POST(`/api/projects/${p.id}/import/preview`, source()); } catch (e) { $('#ierr', el).textContent = e.message; return; }
        const cols = Object.values(r.columns);
        $('#pv', el).innerHTML = `<div class="hint" style="margin-top:14px">Đọc được <b>${r.total}</b> căn: <b>${r.fresh}</b> căn mới, <b>${r.existing}</b> căn đã có (sẽ cập nhật theo mã căn).
          <div style="margin-top:8px" class="small">Cột nhận được: ${cols.map((c) => `<span class="tag">${esc(c.label)} ← ${esc(c.header)}</span>`).join(' ')}</div>
          ${r.warnings.length ? `<div class="small" style="margin-top:8px;color:var(--hold)">${r.warnings.map(esc).join('<br>')}</div>` : ''}</div>
          ${r.total ? `<div class="tbl-wrap" style="margin-top:12px"><table class="t"><thead><tr><th>Mã căn</th><th>Loại</th><th>Phân khu</th><th class="num">DT đất</th><th class="num">Giá</th><th>Tình trạng</th></tr></thead><tbody>
          ${r.sample.map((u) => `<tr><td><b>${esc(u.code)}</b></td><td>${esc(u.type)}</td><td>${esc(u.zone)}</td><td class="num">${m2(u.land)}</td><td class="num">${ty(u.price)}</td><td>${stt(u.status)}</td></tr>`).join('')}</tbody></table></div>
          <div class="row" style="margin-top:14px"><button class="btn red" data-act="run">Nhập ${r.total} căn</button><span class="muted small">Chỉ cột có trong dữ liệu được ghi đè. Căn không có trong dữ liệu được giữ nguyên.</span></div>` : ''}`;
      }),
      run: (btn) => busy(btn, async () => {
        const src = source();
        const r = tab === 'sheet' && $('#keep', el).checked
          ? (await PUT(`/api/projects/${p.id}`, { sheetUrl: src.sheetUrl }), await POST(`/api/projects/${p.id}/sync`))
          : await POST(`/api/projects/${p.id}/import`, src);
        m.close(); toast(`Đã nhập: ${r.created} căn mới, ${r.updated} căn cập nhật${r.removed ? `, ${r.removed} căn gỡ bỏ` : ''}`); await reload();
        S.projects = (await GET('/api/projects')).projects; shell(); route();
      })
    });
  }

  // ─── Dự án: thêm, sửa ───
  function projectModal(p) {
    const isNew = !p; p = p || { isPublic: true };
    const m = modal(`<div class="card-h"><h3>${isNew ? 'Thêm dự án' : 'Cài đặt dự án'}</h3><button class="x" data-act="close">×</button></div>
      <form class="card-b form" id="pf" style="overflow-y:auto">
        <label class="f">Tên dự án<input class="in" name="name" required maxlength="120" value="${esc(p.name || '')}" placeholder="Ví dụ: Vinhomes Saigon Park"></label>
        <label class="check"><input type="checkbox" name="isPublic" ${p.isPublic ? 'checked' : ''}> Hiện trên bảng hàng công khai</label>
        <label class="f">Link trang giới thiệu dự án <small>(không bắt buộc; trang WordPress sẽ hiện thêm các tab Tổng quan, Vị trí, Mặt bằng... trên bảng hàng)</small><input class="in" name="pageUrl" type="url" value="${esc(p.pageUrl || '')}" placeholder="https://website-cua-ban.vn/du-an/"></label>
        <label class="f">Link Google Sheet đồng bộ tự động <small>(không bắt buộc)</small><input class="in" name="sheetUrl" type="url" value="${esc(p.sheetUrl || '')}" placeholder="https://docs.google.com/spreadsheets/d/..."></label>
        <label class="f">Thứ tự hiển thị<input class="in" name="sort" type="number" value="${esc(p.sort || 0)}" style="width:120px"></label>
        <div class="err"></div>
        <div class="row"><button class="btn red" type="submit">${isNew ? 'Tạo dự án' : 'Lưu'}</button><button class="btn ghost" type="button" data-act="close">Hủy</button>
          ${isNew ? '' : '<span class="sp"></span><button class="btn danger" type="button" data-act="del">Xóa dự án</button>'}</div>
      </form>`);
    bindForm($('#pf', m.el), async (d) => {
      const body = { name: d.name, isPublic: d.isPublic, pageUrl: d.pageUrl, sheetUrl: d.sheetUrl, sort: Number(d.sort) || 0 };
      if (isNew) { const r = await POST('/api/projects', body); m.close(); toast('Đã tạo dự án'); go('/du-an/' + r.id); }
      else { await PUT('/api/projects/' + p.id, body); m.close(); toast('Đã lưu'); route(); }
    });
    on(m.el, {
      del: (btn) => {
        const name = prompt(`Xóa dự án sẽ xóa toàn bộ ${p.total} căn và lịch sử giữ căn. Gõ đúng tên dự án "${p.name}" để xác nhận:`);
        if (name === null) return;
        busy(btn, async () => { await DEL('/api/projects/' + p.id, { confirm: name }); m.close(); toast('Đã xóa dự án'); go('/'); });
      }
    });
  }

  // ─── Giữ căn ───
  async function viewHolds(box) {
    const data = await GET('/api/holds'), admin = isAdmin();
    let tab = 'pending';
    const LABEL = { pending: 'Chờ duyệt', approved: 'Đang giữ', rejected: 'Từ chối', released: 'Đã trả', expired: 'Hết hạn' };
    function render() {
      const list = data.holds.filter((h) => (tab === 'history' ? !['pending', 'approved'].includes(h.status) : h.status === tab));
      const n = (s) => data.holds.filter((h) => h.status === s).length;
      box.innerHTML = `<div class="page-h"><div><h1>Giữ căn</h1><p>${admin ? 'Duyệt yêu cầu giữ căn của nhân viên kinh doanh. Căn được duyệt chuyển sang Đang lock và tự trả khi hết hạn.' : 'Yêu cầu giữ căn của bạn.'}</p></div></div>
        <div class="card"><div class="tabs" style="padding:0 14px;margin:0"><button class="${tab === 'pending' ? 'on' : ''}" data-act="tab" data-t="pending">Chờ duyệt (${n('pending')})</button>
          <button class="${tab === 'approved' ? 'on' : ''}" data-act="tab" data-t="approved">Đang giữ (${n('approved')})</button><button class="${tab === 'history' ? 'on' : ''}" data-act="tab" data-t="history">Lịch sử</button></div>
        <div class="tbl-wrap"><table class="t"><thead><tr><th>Căn</th><th>Dự án</th><th class="num">Giá</th><th>Người xin</th><th>Khách hàng</th><th>Thời gian</th><th>Tình trạng</th>${admin && tab !== 'history' ? '<th></th>' : ''}</tr></thead><tbody>
        ${list.map((h) => `<tr data-pid="${h.projectId}"><td><b>${esc(h.code)}</b></td><td>${esc(h.project)}</td><td class="num">${ty(h.price)}</td><td>${esc(h.requester)}</td><td class="wrap">${esc(h.customer)}${h.note ? `<br><span class="small muted">${esc(h.note)}</span>` : ''}</td>
          <td class="small">${h.status === 'approved' ? 'Đến ' + dt(h.expiresAt) : ago(h.createdAt)}</td><td><span class="tag">${LABEL[h.status]}</span>${h.decider ? `<br><span class="small muted">${esc(h.decider)}</span>` : ''}</td>
          ${admin && tab === 'pending' ? `<td class="nowrap"><select class="in" data-hours="${h.id}" style="width:auto;height:32px">${[2, 6, 12, 24, 48, 72].map((x) => `<option value="${x}" ${x === 24 ? 'selected' : ''}>${x} giờ</option>`).join('')}</select>
            <button class="btn sm" data-act="approve" data-id="${h.id}">Duyệt</button> <button class="btn sm danger" data-act="reject" data-id="${h.id}">Từ chối</button></td>` : ''}
          ${admin && tab === 'approved' ? `<td><button class="btn sm ghost" data-act="release" data-id="${h.id}">Trả căn</button></td>` : ''}</tr>`).join('') ||
          `<tr><td colspan="8"><div class="empty"><b>Không có yêu cầu</b>${admin ? '' : 'Mở dự án, chọn căn Còn hàng và bấm "Gửi yêu cầu giữ căn".'}</div></td></tr>`}</tbody></table></div></div>`;
    }
    render();
    const act = (path, body, msg) => async (btn) => busy(btn, async () => { await POST(path(btn), body ? body(btn) : {}); toast(msg); await refreshMe(); route(); });
    on(box, {
      tab: (b) => { tab = b.dataset.t; render(); },
      approve: act((b) => `/api/holds/${b.dataset.id}/approve`, (b) => ({ hours: Number($(`[data-hours="${b.dataset.id}"]`, box).value) }), 'Đã duyệt'),
      reject: act((b) => `/api/holds/${b.dataset.id}/reject`, () => ({ reason: prompt('Lý do từ chối (không bắt buộc):') || '' }), 'Đã từ chối'),
      release: act((b) => `/api/holds/${b.dataset.id}/release`, null, 'Đã trả căn')
    });
  }

  // ─── Biến động ───
  async function viewEvents(box) {
    let project = '', type = '', events = [], end = false;
    box.innerHTML = `<div class="page-h"><div><h1>Biến động giỏ hàng</h1><p>Mọi thay đổi tình trạng, giá, thêm bớt căn và giữ căn, ai làm, lúc nào.</p></div></div>
      <div class="card"><div class="tools"><select class="in" id="ep"><option value="">Tất cả dự án</option>${S.projects.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
        <select class="in" id="et"><option value="">Mọi loại</option><option value="status">Đổi tình trạng</option><option value="price">Đổi giá</option><option value="create">Thêm căn</option><option value="delete">Xóa căn</option><option value="hold">Giữ căn</option><option value="import">Nhập dữ liệu</option></select></div>
        <div class="list" id="el"></div><div style="padding:12px;text-align:center"><button class="btn ghost sm" id="emore">Xem cũ hơn</button></div></div>`;
    async function load(reset) {
      if (reset) { events = []; end = false; }
      const qs = new URLSearchParams(); if (project) qs.set('project', project); if (type) qs.set('type', type); if (events.length) qs.set('before', events[events.length - 1].id);
      const r = await GET('/api/events?' + qs); events = events.concat(r.events); end = r.events.length < 100;
      $('#el').innerHTML = events.map(eventRow).join('') || '<div class="empty"><b>Chưa có biến động</b></div>';
      $('#emore').hidden = end;
    }
    $('#ep').onchange = (e) => { project = e.target.value; load(true); };
    $('#et').onchange = (e) => { type = e.target.value; load(true); };
    $('#emore').onclick = (e) => busy(e.target, () => load(false));
    await load(true);
  }

  // ─── Thành viên ───
  async function viewTeam(box) {
    const r = await GET('/api/members'), admin = isAdmin(), owner = isOwner();
    box.innerHTML = `<div class="page-h"><div><h1>Thành viên</h1><p>${r.members.length}${r.limit ? ' / ' + r.limit : ''} tài khoản. Nhân viên kinh doanh xem giỏ hàng và xin giữ căn; Quản trị cập nhật giỏ hàng, duyệt giữ căn; Chủ tài khoản quản lý thanh toán.</p></div></div>
      ${admin ? `<div class="card card-b" style="margin-bottom:16px"><h3 style="margin-bottom:10px">Mời thành viên</h3><div class="row"><select class="in" id="role" style="width:auto"><option value="sale">Nhân viên kinh doanh</option>${owner ? '<option value="admin">Quản trị</option>' : ''}</select>
        <button class="btn" data-act="invite">Tạo link mời</button><span class="muted small">Link dùng một lần, hạn 7 ngày. Gửi qua Zalo cho người được mời.</span></div><div id="inv"></div></div>` : ''}
      <div class="card"><div class="tbl-wrap"><table class="t"><thead><tr><th>Họ tên</th><th>Email</th><th>Điện thoại</th><th>Vai trò</th><th>Tham gia</th>${admin ? '<th></th>' : ''}</tr></thead><tbody>
      ${r.members.map((m) => `<tr><td><b>${esc(m.name)}</b>${m.id === S.me.user.id ? ' <span class="tag">Bạn</span>' : ''}</td><td>${esc(m.email)}</td><td>${esc(m.phone)}</td>
        <td>${owner && m.id !== S.me.user.id ? `<select class="in" data-role="${m.id}" style="height:32px;width:auto">${['sale', 'admin', 'owner'].map((x) => `<option value="${x}" ${x === m.role ? 'selected' : ''}>${{ sale: 'Nhân viên kinh doanh', admin: 'Quản trị', owner: 'Chủ tài khoản' }[x]}</option>`).join('')}</select>` : esc(m.roleName)}</td>
        <td class="small muted">${day(m.created_at)}</td>
        ${admin ? `<td class="nowrap">${m.role !== 'owner' && m.id !== S.me.user.id && (owner || m.role === 'sale') ? `<button class="btn sm ghost" data-act="reset" data-id="${m.id}">Link đặt lại mật khẩu</button> <button class="btn sm danger" data-act="remove" data-id="${m.id}" data-n="${esc(m.name)}">Gỡ</button>` : ''}</td>` : ''}</tr>`).join('')}
      </tbody></table></div></div>`;
    const showLink = (title, link) => { $('#inv') ? ($('#inv').innerHTML = `<div class="hint" style="margin-top:12px"><b>${title}</b><div class="code" style="margin:8px 0">${esc(link)}</div><button class="btn sm" data-act="copy" data-v="${esc(link)}">Sao chép link</button></div>`) : prompt(title, link); };
    on(box, {
      invite: (b) => busy(b, async () => { const x = await POST('/api/invites', { role: $('#role').value }); showLink(`Link mời ${x.roleName} (hạn ${x.expiresInDays} ngày)`, x.link); }),
      copy: (b) => copy(b.dataset.v, 'Đã sao chép link'),
      reset: (b) => busy(b, async () => { const x = await POST(`/api/members/${b.dataset.id}/reset`); showLink(`Link đặt lại mật khẩu (hạn ${x.expiresInDays} ngày)`, x.link); }),
      remove: (b) => { if (confirm(`Gỡ ${b.dataset.n} khỏi đơn vị?`)) busy(b, async () => { await DEL(`/api/members/${b.dataset.id}`); toast('Đã gỡ'); route(); }); }
    });
    $$('[data-role]', box).forEach((s) => s.addEventListener('change', async () => {
      if (s.value === 'owner' && !confirm('Chuyển quyền chủ tài khoản cho người này? Bạn sẽ thành Quản trị.')) { route(); return; }
      try { await PUT(`/api/members/${s.dataset.role}`, { role: s.value }); toast('Đã đổi vai trò'); await refreshMe(); route(); } catch (e) { toast(e.message, true); route(); }
    }));
  }

  // ─── Bảng hàng công khai ───
  async function viewPublic(box) {
    const r = await GET('/api/workspace'), w = r.workspace;
    box.innerHTML = `<div class="page-h"><div><h1>Bảng hàng công khai</h1><p>Trang bảng hàng cho khách: chỉ hiện mã căn, diện tích, giá, tình trạng (không lộ ghi chú, đối tác). Mang tên, màu, hotline của bạn.</p></div><span class="sp"></span>
      <a class="btn" href="${esc(r.publicUrl)}" target="_blank" rel="noopener">${ic('ext')}Mở bảng hàng</a></div>
      <div class="grid g2">
        <form class="card card-b form" id="wf"><h3>Thương hiệu</h3>
          <label class="f">Tên hiển thị trên bảng hàng<input class="in" name="brandName" maxlength="60" value="${esc(w.brandName)}"></label>
          <div class="form two"><label class="f">Hotline<input class="in" name="hotline" maxlength="20" value="${esc(w.hotline)}" placeholder="0901 234 567"></label>
          <label class="f">Link Zalo<input class="in" name="zalo" type="url" value="${esc(w.zalo)}" placeholder="https://zalo.me/..."></label></div>
          <div class="form two"><label class="f">Màu chủ đạo<input class="in" name="color" type="color" value="${esc(w.color)}" style="padding:4px;height:40px"></label>
          <label class="f">Link logo <small>(https, nền trong suốt)</small><input class="in" name="logoUrl" type="url" value="${esc(w.logoUrl)}"></label></div>
          <label class="f">Tên công ty (chân trang)<input class="in" name="companyName" maxlength="160" value="${esc(w.companyName)}"></label>
          <label class="f">Địa chỉ<input class="in" name="address" maxlength="250" value="${esc(w.address)}"></label>
          <div class="form two"><label class="f">Mã số thuế<input class="in" name="taxCode" maxlength="20" value="${esc(w.taxCode)}"></label>
          <label class="f">Địa chỉ bảng hàng ${isOwner() ? '' : '<small>(chỉ chủ tài khoản đổi được)</small>'}<input class="in" name="slug" value="${esc(w.slug)}" ${isOwner() ? '' : 'disabled'}></label></div>
          <label class="check"><input type="checkbox" name="showSold" ${w.showSold ? 'checked' : ''}> Hiện cả căn đã bán</label>
          <div class="err"></div><div><button class="btn red" type="submit">Lưu</button></div></form>
        <div class="stack">
          <div class="card card-b"><h3>Link bảng hàng</h3><p class="muted small">Gửi cho khách qua Zalo, Facebook, đặt trên danh thiếp.</p><div class="code">${esc(r.publicUrl)}</div>
            <div class="row" style="margin-top:10px"><button class="btn sm" data-act="copy" data-v="${esc(r.publicUrl)}">Sao chép link</button></div></div>
          <div class="card card-b"><h3>Nhúng vào website</h3><p class="muted small">WordPress: thêm khối "HTML tùy chỉnh" (Flatsome: phần tử HTML), dán đoạn mã dưới. Bảng hàng tự cập nhật, không cần sửa website khi giỏ hàng đổi.</p>
            <div class="code">${esc(r.embed)}</div><div class="row" style="margin-top:10px"><button class="btn sm" data-act="copy" data-v="${esc(r.embed)}">Sao chép mã nhúng</button></div></div>
        </div>
      </div>
      <div class="card" style="margin-top:16px"><div class="card-h"><h3>Xem trước</h3><span class="sp"></span><button class="btn sm ghost" data-act="reload">Tải lại</button></div><iframe id="pf" src="${esc('/b/' + w.slug)}" style="width:100%;height:720px;border:0;border-radius:0 0 12px 12px" title="Xem trước bảng hàng"></iframe></div>`;
    on(box, { copy: (b) => copy(b.dataset.v), reload: () => { $('#pf').src = $('#pf').src; } });
    bindForm($('#wf'), async (d) => { if (!isOwner()) delete d.slug; await PUT('/api/workspace', d); toast('Đã lưu'); await refreshMe(); route(); });
  }

  // ─── Gói dịch vụ, thanh toán ───
  async function viewBilling(box) {
    const r = await GET('/api/billing'), ws = await GET('/api/workspace'), sub = r.subscription;
    const vnd = (n) => num(n) + 'đ';
    const lim = (k, label) => { const L = sub.limits[k], U = ws.usage[k]; return `<div><span><b>${label}</b><span>${num(U)}${L ? ' / ' + num(L) : ' (không giới hạn)'}</span></span><div class="bar"><i style="width:${L ? Math.min(100, (U / L) * 100) : 5}%"></i></div></div>`; };
    const pending = r.payments.find((p) => p.status === 'pending');
    box.innerHTML = `<div class="page-h"><div><h1>Gói dịch vụ</h1><p>Gói hiện tại: <b>${esc(sub.planName)}</b>${sub.endsAt ? ` · ${sub.active ? 'hết hạn' : 'đã hết hạn'} ${day(sub.endsAt)}` : ''}</p></div></div>
      <div class="grid g2" style="margin-bottom:16px"><div class="card card-b"><h3 style="margin-bottom:12px">Đang dùng</h3><div class="usage">${lim('projects', 'Dự án')}${lim('units', 'Căn')}${lim('members', 'Tài khoản')}</div></div>
        <div class="card card-b"><h3>Cần hỗ trợ?</h3><p class="muted">Gọi ${esc(r.support.phone)} hoặc <a href="${esc(r.support.zalo)}" target="_blank" rel="noopener">nhắn Zalo</a> để được tư vấn gói phù hợp, chuyển dữ liệu từ Excel/Google Sheet, xuất hóa đơn VAT.</p></div></div>
      ${pending ? `<div class="card card-b" style="margin-bottom:16px">${payBox(pending, r.bank)}</div>` : ''}
      ${r.canPay ? `<div class="row" style="margin-bottom:12px"><b>Thời hạn:</b>${[1, 3, 6, 12].map((m) => `<button class="chip ${m === 12 ? 'on' : ''}" data-act="months" data-m="${m}">${m} tháng${m === 12 ? ` (tặng ${12 - r.yearlyMonthsCharged} tháng)` : ''}</button>`).join('')}</div>` : '<p class="muted">Chỉ chủ tài khoản đăng ký hoặc gia hạn gói được.</p>'}
      <div class="grid g3">${r.plans.map((p) => `<div class="card plan ${p.popular ? 'pop' : ''}">${p.popular ? '<span class="ribbon">Phổ biến</span>' : ''}<h3>${esc(p.name)}</h3>
        <div class="price">${p.price == null ? 'Liên hệ' : vnd(p.price) + '<small> / tháng</small>'}</div><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        ${r.canPay ? (p.price == null ? `<a class="btn ghost" href="${esc(r.support.zalo)}" target="_blank" rel="noopener">Liên hệ báo giá</a>` : `<button class="btn ${p.popular ? 'red' : ''}" data-act="order" data-p="${p.id}">${sub.plan === p.id ? 'Gia hạn' : 'Chọn gói'}</button>`) : ''}</div>`).join('')}</div>
      <p class="muted small">Giá đã gồm VAT. Thanh toán bằng chuyển khoản; gói được kích hoạt sau khi bộ phận kế toán xác nhận (thường trong giờ làm việc).</p>
      ${r.payments.length ? `<div class="card" style="margin-top:16px"><div class="card-h"><h3>Lịch sử thanh toán</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>Mã</th><th>Gói</th><th>Thời hạn</th><th class="num">Số tiền</th><th>Tạo lúc</th><th>Tình trạng</th></tr></thead><tbody>
        ${r.payments.map((p) => `<tr><td>${esc(p.ref)}</td><td>${esc(p.planName)}</td><td>${p.months} tháng</td><td class="num">${vnd(p.amount)}</td><td class="small">${dt(p.createdAt)}</td><td><span class="tag">${{ pending: 'Chờ xác nhận', paid: 'Đã thanh toán', cancelled: 'Đã hủy' }[p.status]}</span></td></tr>`).join('')}</tbody></table></div></div>` : ''}`;
    let months = 12;
    on(box, {
      months: (b) => { months = Number(b.dataset.m); $$('[data-act=months]', box).forEach((x) => x.classList.toggle('on', x === b)); },
      order: (b) => busy(b, async () => {
        const o = await POST('/api/billing/orders', { plan: b.dataset.p, months });
        const plan = r.plans.find((x) => x.id === b.dataset.p);
        modal(`<div class="card-h"><h3>Thanh toán gói ${esc(plan.name)}</h3><button class="x" data-act="close">×</button></div><div class="card-b">${payBox({ ...o, months, planName: plan.name, qr: o.qr }, r.bank)}</div>`);
        viewBilling(box);
      })
    });
  }
  function payBox(p, bank) {
    return `<div class="qr"><img src="${esc(p.qr)}" alt="Mã QR chuyển khoản"><div class="stack"><h3>Chuyển khoản để kích hoạt gói ${esc(p.planName)} (${p.months} tháng)</h3>
      <div class="kv"><div><span>Số tiền</span><b>${num(p.amount)}đ</b></div><div><span>Nội dung chuyển khoản</span><b>${esc(p.ref)}</b></div>
      <div><span>Số tài khoản</span><b>${esc(bank.account)}</b></div><div><span>Chủ tài khoản</span><b>${esc(bank.holder)}</b></div></div>
      <p class="small muted" style="margin:0">${esc(bank.name)}. Quét mã QR bằng ứng dụng ngân hàng để điền sẵn số tiền và nội dung. Ghi đúng nội dung <b>${esc(p.ref)}</b> để được kích hoạt nhanh.</p></div></div>`;
  }

  // ─── Tài khoản ───
  async function viewAccount(box) {
    const u = S.me.user;
    box.innerHTML = `<div class="page-h"><div><h1>Tài khoản</h1><p>${esc(u.email)}</p></div></div><div class="grid g2">
      <form class="card card-b form" id="af"><h3>Thông tin</h3><label class="f">Họ tên<input class="in" name="name" value="${esc(u.name)}" required maxlength="80"></label>
        <label class="f">Số điện thoại<input class="in" name="phone" value="${esc(u.phone)}" maxlength="20"></label><div class="err"></div><div><button class="btn" type="submit">Lưu</button></div></form>
      <form class="card card-b form" id="pw"><h3>Đổi mật khẩu</h3><label class="f">Mật khẩu hiện tại<input class="in" name="currentPassword" type="password" required autocomplete="current-password"></label>
        <label class="f">Mật khẩu mới <small>(ít nhất 8 ký tự)</small><input class="in" name="newPassword" type="password" minlength="8" required autocomplete="new-password"></label>
        <div class="err"></div><div><button class="btn" type="submit">Đổi mật khẩu</button></div><p class="small muted" style="margin:0">Các thiết bị khác sẽ bị đăng xuất.</p></form></div>`;
    bindForm($('#af'), async (d) => { await PUT('/api/me', d); await refreshMe(); toast('Đã lưu'); route(); });
    bindForm($('#pw'), async (d) => { await PUT('/api/me', d); toast('Đã đổi mật khẩu'); $('#pw').reset(); });
  }

  // ─── Quản trị hệ thống ───
  async function viewAdmin(box) {
    if (!S.me.user.superadmin) { box.innerHTML = '<div class="card empty"><b>Không có quyền</b></div>'; return; }
    const r = await GET('/api/admin/overview');
    const pend = r.payments.filter((p) => p.status === 'pending');
    const rev = r.payments.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
    box.innerHTML = `<div class="page-h"><div><h1>Quản trị hệ thống</h1><p>Khách hàng, gói dịch vụ, thanh toán.</p></div></div>
      <div class="grid g4" style="margin-bottom:16px"><div class="card kpi"><span>Đơn vị</span><b>${r.workspaces.length}</b></div>
        <div class="card kpi ok"><span>Đang trả phí</span><b>${r.workspaces.filter((w) => w.subscription.active && w.subscription.plan !== 'trial').length}</b></div>
        <div class="card kpi hold"><span>Đang dùng thử</span><b>${r.workspaces.filter((w) => w.subscription.active && w.subscription.plan === 'trial').length}</b></div>
        <div class="card kpi"><span>Doanh thu đã xác nhận</span><b style="font-size:20px">${num(rev)}đ</b></div></div>
      <div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Thanh toán chờ xác nhận (${pend.length})</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>Nội dung CK</th><th>Đơn vị</th><th>Gói</th><th class="num">Số tiền</th><th>Tạo lúc</th><th></th></tr></thead><tbody>
        ${pend.map((p) => `<tr><td><b>${esc(p.ref)}</b></td><td>${esc(p.workspace)}</td><td>${esc(p.planName)} · ${p.months} tháng</td><td class="num">${num(p.amount)}đ</td><td class="small">${dt(p.createdAt)}</td>
          <td class="nowrap"><button class="btn sm" data-act="confirm" data-id="${p.id}" data-ref="${esc(p.ref)}" data-amt="${p.amount}">Đã nhận tiền</button> <button class="btn sm ghost" data-act="cancel" data-id="${p.id}">Hủy</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Không có.</td></tr>'}</tbody></table></div></div>
      <div class="card"><div class="card-h"><h3>Đơn vị</h3><span class="sp"></span><input class="in" id="wq" placeholder="Tìm tên, email..." style="width:220px;height:34px"></div><div class="tbl-wrap"><table class="t"><thead><tr><th>Đơn vị</th><th>Chủ tài khoản</th><th>Gói</th><th>Hết hạn</th><th class="num">Dự án / căn / người</th><th>Tạo</th><th></th></tr></thead><tbody id="wt">
        ${r.workspaces.map((w) => `<tr data-q="${esc(norm(w.name + ' ' + w.owner + ' ' + w.slug))}"><td><b>${esc(w.name)}</b><br><a class="small" href="/b/${esc(w.slug)}" target="_blank" rel="noopener">/b/${esc(w.slug)}</a></td><td class="small">${esc(w.owner)}</td>
          <td>${esc(w.subscription.planName)} ${w.status === 'suspended' ? '<span class="tag">Tạm khóa</span>' : w.subscription.active ? '' : '<span class="tag">Hết hạn</span>'}</td><td class="small">${day(w.subscription.endsAt)}</td>
          <td class="num">${w.projects} / ${num(w.units)} / ${w.members}</td><td class="small muted">${day(w.createdAt)}</td>
          <td class="nowrap"><button class="btn sm ghost" data-act="edit" data-id="${w.id}">Sửa gói</button> <button class="btn sm ghost" data-act="resetOwner" data-id="${w.id}">Link đặt lại MK</button></td></tr>`).join('')}</tbody></table></div></div>`;
    $('#wq').addEventListener('input', (e) => { const q = norm(e.target.value); $$('#wt tr', box).forEach((tr) => { tr.hidden = q && !tr.dataset.q.includes(q); }); });
    on(box, {
      confirm: (b) => { if (confirm(`Xác nhận đã nhận ${num(b.dataset.amt)}đ với nội dung ${b.dataset.ref}?`)) busy(b, async () => { await POST(`/api/admin/payments/${b.dataset.id}/confirm`); toast('Đã kích hoạt gói'); route(); }); },
      cancel: (b) => busy(b, async () => { await POST(`/api/admin/payments/${b.dataset.id}/cancel`); route(); }),
      resetOwner: (b) => busy(b, async () => { const x = await POST(`/api/admin/workspaces/${b.dataset.id}/reset-owner`); prompt('Link đặt lại mật khẩu cho chủ tài khoản (hạn 2 ngày):', x.link); }),
      edit: (b) => {
        const w = r.workspaces.find((x) => String(x.id) === b.dataset.id);
        const m = modal(`<div class="card-h"><h3>${esc(w.name)}</h3><button class="x" data-act="close">×</button></div><form class="card-b form" id="af">
          <label class="f">Gói<select class="in" name="plan">${r.plans.map((p) => `<option value="${p.id}" ${p.id === w.subscription.plan ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
          <label class="f">Trả phí đến ngày<input class="in" type="date" name="paidUntil" value="${w.subscription.plan !== 'trial' && w.subscription.endsAt ? w.subscription.endsAt.slice(0, 10) : ''}"></label>
          <label class="f">Gia hạn dùng thử thêm (ngày, tính từ hôm nay) <small>chỉ khi gói là Dùng thử</small><input class="in" type="number" name="trialDays" min="0" max="90" value=""></label>
          <label class="f">Trạng thái<select class="in" name="status"><option value="active" ${w.status === 'active' ? 'selected' : ''}>Hoạt động</option><option value="suspended" ${w.status === 'suspended' ? 'selected' : ''}>Tạm khóa</option></select></label>
          <div class="err"></div><div><button class="btn red" type="submit">Lưu</button></div></form>`);
        bindForm($('#af', m.el), async (d) => {
          const body = { plan: d.plan, status: d.status, paidUntil: d.paidUntil ? d.paidUntil + 'T23:59:59+07:00' : null };
          if (Number(d.trialDays)) body.trialDays = Number(d.trialDays);
          await PUT(`/api/admin/workspaces/${w.id}`, body); m.close(); toast('Đã lưu'); route();
        });
      }
    });
  }

  boot();
})();
