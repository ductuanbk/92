import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, client, signup, SAMPLE } from './helpers.js';

let T;
const sheetCsv = { body: 'Mã căn,Giá,Tình trạng\nG-1,5 tỷ,Còn hàng\nG-2,6 tỷ,Đã bán\n', ok: true, html: false };
before(async () => {
  T = await startApp({
    fetch: async (url) => {
      if (!String(url).startsWith('https://docs.google.com/spreadsheets/d/')) throw new Error('blocked ' + url);
      return { ok: sheetCsv.ok, headers: new Map([['content-type', sheetCsv.html ? 'text/html' : 'text/csv']]), text: async () => sheetCsv.body };
    }
  });
});
after(async () => { await T.close(); });

test('đăng ký, đăng nhập, đăng xuất', async () => {
  const { c, email, password } = await signup(T.base);
  let me = await c.get('/api/me');
  assert.equal(me.data.user.email, email);
  assert.equal(me.data.role, 'owner');
  assert.equal(me.data.workspace.subscription.plan, 'trial');
  assert.equal(me.data.workspace.subscription.active, true);
  await c.post('/api/auth/logout');
  me = await c.get('/api/me');
  assert.equal(me.data.user, null);
  const bad = await c.post('/api/auth/login', { email, password: 'sai-mat-khau' });
  assert.equal(bad.status, 401);
  const ok = await c.post('/api/auth/login', { email, password });
  assert.equal(ok.status, 200);
  assert.equal((await c.get('/api/me')).data.user.email, email);
});

test('đăng ký trùng email, mật khẩu ngắn, chưa đồng ý điều khoản', async () => {
  const { email } = await signup(T.base);
  const c = client(T.base);
  assert.equal((await c.post('/api/auth/signup', { company: 'X', name: 'Y', email, phone: '0901234567', password: 'matkhau123', agree: true })).status, 409);
  assert.equal((await c.post('/api/auth/signup', { company: 'X', name: 'Y', email: 'new1@test.vn', phone: '0901234567', password: '123', agree: true })).status, 400);
  assert.equal((await c.post('/api/auth/signup', { company: 'X', name: 'Y', email: 'new2@test.vn', phone: '0901234567', password: 'matkhau123' })).status, 400);
});

test('giới hạn số lần đăng nhập sai', async () => {
  const L = await startApp({ loginLimit: 3 });
  try {
    const c = client(L.base);
    const codes = [];
    for (let i = 0; i < 5; i++) codes.push((await c.post('/api/auth/login', { email: 'x@test.vn', password: 'sai' })).status);
    assert.deepEqual(codes, [401, 401, 401, 429, 429]);
  } finally { await L.close(); }
});

test('chặn yêu cầu thiếu tiêu đề chống giả mạo (CSRF) và khác nguồn', async () => {
  const { c } = await signup(T.base);
  const r1 = await c.post('/api/projects', { name: 'A' }, { 'x-gh': '0' });
  assert.equal(r1.status, 403);
  const r2 = await c.post('/api/projects', { name: 'A' }, { origin: 'https://evil.example' });
  assert.equal(r2.status, 403);
});

test('dự án, nhập dữ liệu dán từ Excel, xem trước, nhật ký', async () => {
  const { c } = await signup(T.base);
  const p = await c.post('/api/projects', { name: 'Vinhomes Test', pageUrl: 'https://example.com/du-an/' });
  assert.equal(p.status, 200);
  const pid = p.data.id;
  const pre = await c.post(`/api/projects/${pid}/import/preview`, { text: SAMPLE });
  assert.equal(pre.status, 200);
  assert.equal(pre.data.total, 3);
  assert.equal(pre.data.fresh, 3);
  assert.equal(pre.data.columns.price.header, 'Giá gồm VAT và KPBT');
  const imp = await c.post(`/api/projects/${pid}/import`, { text: SAMPLE });
  assert.deepEqual([imp.data.created, imp.data.updated], [3, 0]);
  // Nhập lại: không trùng, không đổi gì.
  const again = await c.post(`/api/projects/${pid}/import`, { text: SAMPLE });
  assert.deepEqual([again.data.created, again.data.updated, again.data.unchanged], [0, 0, 3]);
  // Đổi giá một căn qua file: chỉ căn đó được cập nhật, ghi nhật ký giá.
  const changed = await c.post(`/api/projects/${pid}/import`, { text: SAMPLE.replace('10.203.235.501', '10.500.000.000') });
  assert.equal(changed.data.updated, 1);
  const units = (await c.get(`/api/projects/${pid}/units`)).data.units;
  assert.equal(units.length, 3);
  assert.equal(units.find((u) => u.code === 'AS47-16').price, 10500000000);
  const ev = (await c.get('/api/events?type=price')).data.events;
  assert.ok(ev.some((e) => e.code === 'AS47-16' && /10,2 tỷ → 10,5 tỷ/.test(e.detail)), JSON.stringify(ev));
  const list = (await c.get('/api/projects')).data.projects[0];
  assert.equal(list.total, 3);
  assert.equal(list.byStatus['Còn hàng'], 1);
});

test('sửa căn, thao tác hàng loạt, trùng mã, dữ liệu sai', async () => {
  const { c } = await signup(T.base);
  const pid = (await c.post('/api/projects', { name: 'P' })).data.id;
  const a = (await c.post(`/api/projects/${pid}/units`, { code: 'A-1', price: 5e9, land: 80, status: 'Còn hàng' })).data.id;
  const b = (await c.post(`/api/projects/${pid}/units`, { code: 'A-2', price: 6e9 })).data.id;
  assert.equal((await c.post(`/api/projects/${pid}/units`, { code: 'A-1' })).status, 409);
  assert.equal((await c.post(`/api/projects/${pid}/units`, { code: 'A-3', status: 'Bán rồi' })).status, 400);
  assert.equal((await c.post(`/api/projects/${pid}/units`, { code: 'A-3', price: -1 })).status, 400);
  assert.equal((await c.put(`/api/units/${a}`, { status: 'Đã cọc', note: 'Khách anh Nam' })).data.changed, true);
  assert.equal((await c.put(`/api/units/${b}`, { code: 'A-1' })).status, 409);
  const bulk = await c.post(`/api/projects/${pid}/bulk`, { ids: [a, b], status: 'Đã bán' });
  assert.equal(bulk.data.count, 2);
  const del = await c.post(`/api/projects/${pid}/bulk`, { ids: [b], action: 'delete' });
  assert.equal(del.data.count, 1);
  assert.equal((await c.get(`/api/projects/${pid}/units`)).data.units.length, 1);
});

test('dữ liệu giữa các đơn vị tách biệt hoàn toàn', async () => {
  const A = await signup(T.base), B = await signup(T.base);
  const pid = (await A.c.post('/api/projects', { name: 'Bí mật' })).data.id;
  const uid = (await A.c.post(`/api/projects/${pid}/units`, { code: 'X-1', note: 'nội bộ' })).data.id;
  assert.equal((await B.c.get(`/api/projects/${pid}/units`)).status, 404);
  assert.equal((await B.c.put(`/api/units/${uid}`, { status: 'Đã bán' })).status, 404);
  assert.equal((await B.c.post(`/api/units/${uid}/hold`, {})).status, 404);
  assert.equal((await B.c.post(`/api/projects/${pid}/bulk`, { ids: [uid], action: 'delete' })).status, 404);
  assert.equal((await B.c.get('/api/projects')).data.projects.length, 0);
  assert.equal((await B.c.get('/api/events')).data.events.some((e) => e.code === 'X-1'), false);
});

test('mời thành viên, phân quyền nhân viên kinh doanh', async () => {
  const { c } = await signup(T.base);
  const pid = (await c.post('/api/projects', { name: 'P' })).data.id;
  const uid = (await c.post(`/api/projects/${pid}/units`, { code: 'S-1', price: 7e9 })).data.id;
  const inv = await c.post('/api/invites', { role: 'sale' });
  const token = inv.data.link.split('/moi/')[1];
  const sale = client(T.base);
  assert.equal((await sale.get(`/api/invites/${token}`)).data.role, 'sale');
  assert.equal((await sale.post(`/api/invites/${token}/accept`, { name: 'Sale A', email: 'salea@test.vn', password: 'matkhau123' })).status, 200);
  assert.equal((await sale.get('/api/me')).data.role, 'sale');
  // Link mời chỉ dùng một lần.
  assert.equal((await client(T.base).get(`/api/invites/${token}`)).status, 404);
  // Nhân viên xem được, không sửa được.
  assert.equal((await sale.get(`/api/projects/${pid}/units`)).status, 200);
  assert.equal((await sale.put(`/api/units/${uid}`, { status: 'Đã bán' })).status, 403);
  assert.equal((await sale.post('/api/projects', { name: 'Q' })).status, 403);
  assert.equal((await sale.post('/api/invites', { role: 'sale' })).status, 403);
  assert.equal((await sale.post('/api/billing/orders', { plan: 'pro', months: 1 })).status, 403);
  const members = (await c.get('/api/members')).data.members;
  assert.equal(members.length, 2);
});

test('xin giữ căn → duyệt → trả căn; từ chối; hết hạn tự trả', async () => {
  const { c } = await signup(T.base);
  const pid = (await c.post('/api/projects', { name: 'P' })).data.id;
  const u1 = (await c.post(`/api/projects/${pid}/units`, { code: 'H-1' })).data.id;
  const u2 = (await c.post(`/api/projects/${pid}/units`, { code: 'H-2' })).data.id;
  const token = (await c.post('/api/invites', { role: 'sale' })).data.link.split('/moi/')[1];
  const sale = client(T.base);
  await sale.post(`/api/invites/${token}/accept`, { name: 'Sale B', email: 'saleb@test.vn', password: 'matkhau123' });

  const h1 = (await sale.post(`/api/units/${u1}/hold`, { customer: 'Anh Minh 0909' })).data.id;
  const st = async (id) => (await c.get(`/api/projects/${pid}/units`)).data.units.find((u) => u.id === id).status;
  assert.equal(await st(u1), 'Check admin');
  assert.equal((await sale.post(`/api/units/${u1}/hold`, {})).status, 409, 'không giữ trùng');
  assert.equal((await sale.post(`/api/holds/${h1}/approve`, {})).status, 403, 'nhân viên không tự duyệt');
  assert.equal((await c.post(`/api/holds/${h1}/approve`, { hours: 24 })).status, 200);
  assert.equal(await st(u1), 'Đang lock');
  assert.equal((await c.post(`/api/holds/${h1}/release`, {})).status, 200);
  assert.equal(await st(u1), 'Còn hàng');

  const h2 = (await sale.post(`/api/units/${u2}/hold`, {})).data.id;
  assert.equal((await c.post(`/api/holds/${h2}/reject`, { reason: 'Khách chưa cọc' })).status, 200);
  assert.equal(await st(u2), 'Còn hàng');

  const h3 = (await sale.post(`/api/units/${u2}/hold`, {})).data.id;
  await c.post(`/api/holds/${h3}/approve`, { hours: 2 });
  T.db.prepare("UPDATE holds SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").run(h3);
  assert.equal(await st(u2), 'Còn hàng', 'hết hạn tự trả căn');
  const holds = (await sale.get('/api/holds')).data.holds;
  assert.equal(holds.length, 3);
  assert.equal(holds.find((h) => h.id === h3).status, 'expired');
});

test('bảng hàng công khai: chỉ trường an toàn, ẩn căn đã bán, JSONP, trang và mã nhúng', async () => {
  const { c } = await signup(T.base, { company: 'Sàn Công Khai' });
  const ws = (await c.get('/api/workspace')).data;
  const pid = (await c.post('/api/projects', { name: 'Dự án A', pageUrl: 'https://example.com/a/' })).data.id;
  await c.post(`/api/projects/${pid}/import`, { text: SAMPLE });
  await c.put('/api/workspace', { brandName: 'Sàn ABC', hotline: '0909 111 222', zalo: 'https://zalo.me/123', color: '#123456' });
  const anon = client(T.base);
  const pub = await anon.get(`/api/public/${ws.workspace.slug}`);
  assert.equal(pub.data.ok, true);
  const units = pub.data.projects[0].units;
  assert.deepEqual(units.map((u) => u.code).sort(), ['AS47-16', 'SL2-01']);
  const a = units.find((u) => u.code === 'AS47-16');
  assert.equal(a.note, undefined, 'không lộ ghi chú nội bộ');
  assert.equal(a.partner, undefined);
  assert.equal(a.status, 'Còn hàng');
  assert.equal(units.find((u) => u.code === 'SL2-01').status, 'Đang giữ chỗ');
  const jsonp = await anon.get(`/api/public/${ws.workspace.slug}?callback=cb123`);
  assert.match(jsonp.data, /^\/\*\*\/cb123\(\{"ok":true/);
  assert.equal((await anon.get(`/api/public/${ws.workspace.slug}?callback=alert(1)`)).status, 400);
  const page = await anon.get(`/b/${ws.workspace.slug}`);
  assert.equal(page.status, 200);
  assert.match(page.data, /Sàn ABC/);
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  const emb = await anon.get(`/embed/${ws.workspace.slug}.js`);
  assert.match(emb.data, /"brandName":"Sàn ABC"/);
  assert.match(emb.data, /"brandColor":"#123456"/);
  assert.match(emb.data, /data-adl-bang-hang/);
  assert.equal((await anon.get('/b/khong-ton-tai')).status, 404);
});

test('đồng bộ Google Sheet: thêm, cập nhật, gỡ căn không còn; sheet chưa chia sẻ thì báo lỗi, giữ dữ liệu', async () => {
  const { c } = await signup(T.base);
  const pid = (await c.post('/api/projects', { name: 'Sheet', sheetUrl: 'https://docs.google.com/spreadsheets/d/1F7AQQ9vbz4oPSUIVA2UQIQMUyFZxjOMbZS9HokU1eRM/edit#gid=0' })).data.id;
  await c.post(`/api/projects/${pid}/units`, { code: 'OLD-1' });
  const s1 = await c.post(`/api/projects/${pid}/sync`, {});
  assert.deepEqual([s1.data.created, s1.data.removed], [2, 1]);
  let units = (await c.get(`/api/projects/${pid}/units`)).data.units;
  assert.deepEqual(units.map((u) => u.code).sort(), ['G-1', 'G-2']);
  sheetCsv.html = true;
  const s2 = await c.post(`/api/projects/${pid}/sync`, {});
  assert.equal(s2.status, 400);
  sheetCsv.html = false;
  units = (await c.get(`/api/projects/${pid}/units`)).data.units;
  assert.equal(units.length, 2, 'lỗi tải sheet không xóa dữ liệu');
  const p = (await c.get('/api/projects')).data.projects[0];
  assert.match(p.sheetError, /chia sẻ/);
});

test('giới hạn gói, hết hạn thì chỉ xem, thanh toán và duyệt thanh toán', async () => {
  const { c, email } = await signup(T.base);
  const me = (await c.get('/api/me')).data;
  // Hết hạn dùng thử.
  T.db.prepare("UPDATE workspaces SET trial_ends_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").run(me.workspace.id);
  assert.equal((await c.post('/api/projects', { name: 'P' })).status, 402);
  assert.equal((await c.get('/api/projects')).status, 200, 'vẫn xem được');
  const order = await c.post('/api/billing/orders', { plan: 'starter', months: 12 });
  assert.equal(order.status, 200);
  assert.equal(order.data.amount, 990000 * 10, 'trả năm tính 10 tháng');
  assert.match(order.data.ref, /^GH\d+N\d+$/);
  assert.match(order.data.qr, /^https:\/\/img\.vietqr\.io\/image\/970407-19037047058017/);
  // Người thường không duyệt được.
  assert.equal((await c.post(`/api/admin/payments/${order.data.id}/confirm`, {})).status, 403);
  // Quản trị hệ thống duyệt.
  const admin = await signup(T.base);
  T.db.prepare('UPDATE users SET is_superadmin = 1 WHERE email = ?').run(admin.email);
  const ov = await admin.c.get('/api/admin/overview');
  assert.ok(ov.data.payments.some((p) => p.id === order.data.id && p.status === 'pending'));
  assert.equal((await admin.c.post(`/api/admin/payments/${order.data.id}/confirm`, {})).status, 200);
  const sub = (await c.get('/api/me')).data.workspace.subscription;
  assert.equal(sub.plan, 'starter');
  assert.equal(sub.active, true);
  // Gói Cơ bản: tối đa 2 dự án.
  assert.equal((await c.post('/api/projects', { name: 'P1' })).status, 200);
  assert.equal((await c.post('/api/projects', { name: 'P2' })).status, 200);
  const third = await c.post('/api/projects', { name: 'P3' });
  assert.equal(third.status, 402);
  assert.match(third.data.error, /tối đa 2 dự án/);
  void email;
});

test('đặt lại mật khẩu bằng link do quản trị tạo', async () => {
  const { c } = await signup(T.base);
  const token = (await c.post('/api/invites', { role: 'sale' })).data.link.split('/moi/')[1];
  const sale = client(T.base);
  await sale.post(`/api/invites/${token}/accept`, { name: 'Sale C', email: 'salec@test.vn', password: 'matkhau123' });
  const uid = (await c.get('/api/members')).data.members.find((m) => m.email === 'salec@test.vn').id;
  const link = (await c.post(`/api/members/${uid}/reset`, {})).data.link;
  const rt = link.split('/dat-lai-mat-khau/')[1];
  assert.equal((await client(T.base).post(`/api/reset/${rt}`, { password: 'matkhaumoi1' })).status, 200);
  assert.equal((await sale.get('/api/me')).data.user, null, 'phiên cũ bị đăng xuất');
  assert.equal((await client(T.base).post('/api/auth/login', { email: 'salec@test.vn', password: 'matkhaumoi1' })).status, 200);
  assert.equal((await client(T.base).post(`/api/reset/${rt}`, { password: 'matkhaumoi2' })).status, 404, 'link dùng một lần');
});
