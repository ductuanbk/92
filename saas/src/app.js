// Ứng dụng: toàn bộ API và trang. createApp(db) trả về hàm xử lý yêu cầu HTTP (dùng chung cho máy chủ và kiểm thử).
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { PRODUCT, PLANS, BANK, SETTINGS, STATUS, STATUS_LIST, PUBLIC_STATUS, YEARLY_MONTHS_CHARGED } from './config.js';
import { router, send, sendHtml, serveStatic, readBody, parseCookies, cookie, fail, HttpError, rateLimiter, clientIp } from './http.js';
import { hashPassword, verifyPassword, checkPassword, createSession, loadSession, need, needActive, subscription, newToken, sha, ROLE_RANK, ROLE_NAME } from './auth.js';
import { tx } from './db.js';
import { rowsToUnits, parseTable, sheetCsvUrl, norm, MONEY_FIELDS } from './parse.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const SID = 'gh_sid';

// ─── Tiện ích ───
const str = (v, max = 200) => String(v == null ? '' : v).trim().slice(0, max);
const httpsUrl = (v) => { const s = str(v, 1000); return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s : ''; };
const anyUrl = (v) => { const s = str(v, 1000); return /^https?:\/\/[^\s"'<>]+$/i.test(s) ? s : ''; };
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const plusDays = (d, from = Date.now()) => new Date(from + d * 86400000).toISOString();
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => (n == null ? '' : Number(n).toLocaleString('vi-VN'));
const ty = (n) => (n ? (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ' : 'trống');

export function slugify(s) {
  return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'don-vi';
}

const UNIT_COLS = {
  code: 'code', zone: 'zone', street: 'street', type: 'type', direction: 'direction', handover: 'handover',
  land: 'land', build: 'build', price: 'price', priceExVat: 'price_ex_vat', priceLoan: 'price_loan',
  priceEarly: 'price_early', priceProgress: 'price_progress', fund: 'fund', exclusive: 'exclusive',
  status: 'status', ptg: 'ptg', unitLink: 'unit_link', note: 'note', partner: 'partner'
};
const NUM_FIELDS = new Set(['land', 'build', ...MONEY_FIELDS]);
const FIELD_LABEL = { price: 'Giá niêm yết', priceExVat: 'Giá chưa VAT', priceLoan: 'Giá vay', priceEarly: 'Giá TTS', priceProgress: 'Giá TTTĐ',
  status: 'Tình trạng', note: 'Ghi chú', land: 'DT đất', build: 'DT xây dựng', type: 'Loại hình', zone: 'Phân khu', street: 'Dãy',
  direction: 'Hướng', handover: 'Bàn giao', fund: 'Quỹ căn', exclusive: 'Độc quyền', ptg: 'Phiếu tính giá', unitLink: 'Chỉ căn', partner: 'Đối tác', code: 'Mã căn' };

function unitDto(r) {
  const o = { id: r.id, projectId: r.project_id, updatedAt: r.updated_at };
  for (const [k, c] of Object.entries(UNIT_COLS)) o[k] = r[c];
  o.exclusive = !!r.exclusive;
  return o;
}

/** Làm sạch dữ liệu một căn gửi từ giao diện hoặc từ file nhập. */
function cleanUnit(input, { partial = false } = {}) {
  const out = {};
  for (const k of Object.keys(UNIT_COLS)) {
    if (!(k in input)) continue;
    let v = input[k];
    if (NUM_FIELDS.has(k)) {
      v = v === '' || v == null ? null : Number(v);
      if (v != null && (!Number.isFinite(v) || v < 0)) fail(400, `${FIELD_LABEL[k]} không hợp lệ.`);
    } else if (k === 'exclusive') v = v ? 1 : 0;
    else if (k === 'status') { v = str(v, 40); if (!STATUS_LIST.includes(v)) fail(400, 'Tình trạng không hợp lệ.'); }
    else if (k === 'ptg' || k === 'unitLink') v = anyUrl(v);
    else v = str(v, k === 'note' ? 1000 : 200);
    out[k] = v;
  }
  if (!partial && !out.code) fail(400, 'Vui lòng nhập mã căn.');
  if ('code' in out && !out.code) fail(400, 'Mã căn không được để trống.');
  return out;
}

export function createApp(db, opts = {}) {
  const r = router();
  const loginLimit = rateLimiter(opts.loginLimit ?? 10, 15 * 60 * 1000);
  const signupLimit = rateLimiter(opts.signupLimit ?? 5, 60 * 60 * 1000);
  const fetchImpl = opts.fetch || fetch;
  const pubCache = new Map(); // slug → { at, body }
  const touch = (wsId) => { for (const [k, v] of pubCache) if (v.wsId === wsId) pubCache.delete(k); };

  const logEvent = (wsId, e) => db.prepare('INSERT INTO events (workspace_id, project_id, unit_id, unit_code, user_id, type, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(wsId, e.projectId ?? null, e.unitId ?? null, e.code || '', e.userId ?? null, e.type, str(e.detail, 2000));

  const getProject = (wsId, id) => {
    const p = db.prepare('SELECT * FROM projects WHERE id = ? AND workspace_id = ?').get(Number(id), wsId);
    if (!p) fail(404, 'Không tìm thấy dự án.');
    return p;
  };
  const getUnit = (wsId, id) => {
    const u = db.prepare('SELECT * FROM units WHERE id = ? AND workspace_id = ?').get(Number(id), wsId);
    if (!u) fail(404, 'Không tìm thấy căn.');
    return u;
  };
  const countUnits = (wsId) => db.prepare('SELECT COUNT(*) n FROM units WHERE workspace_id = ?').get(wsId).n;
  const limitCheck = (ws, kind, adding) => {
    const lim = subscription(ws).limits[kind];
    if (lim == null) return;
    const cur = kind === 'projects' ? db.prepare('SELECT COUNT(*) n FROM projects WHERE workspace_id = ?').get(ws.id).n
      : kind === 'units' ? countUnits(ws.id)
        : db.prepare('SELECT COUNT(*) n FROM memberships WHERE workspace_id = ?').get(ws.id).n;
    if (cur + adding > lim) fail(402, `Gói ${subscription(ws).planName} cho tối đa ${lim.toLocaleString('vi-VN')} ${{ projects: 'dự án', units: 'căn', members: 'tài khoản' }[kind]}. Vui lòng nâng cấp gói.`);
  };

  // Hết hạn giữ căn: trả căn về Còn hàng.
  function expireHolds(wsId) {
    const now = new Date().toISOString();
    const rows = db.prepare(`SELECT h.*, u.code, u.project_id, u.status ustatus FROM holds h JOIN units u ON u.id = h.unit_id
      WHERE h.status = 'approved' AND h.expires_at < ? ${wsId ? 'AND h.workspace_id = ?' : ''}`).all(...(wsId ? [now, wsId] : [now]));
    for (const h of rows) {
      tx(db, () => {
        db.prepare("UPDATE holds SET status = 'expired' WHERE id = ?").run(h.id);
        if (h.ustatus === STATUS.LOCKED) {
          db.prepare("UPDATE units SET status = ?, updated_at = datetime('now') WHERE id = ?").run(STATUS.AVAILABLE, h.unit_id);
          logEvent(h.workspace_id, { projectId: h.project_id, unitId: h.unit_id, code: h.code, type: 'hold_expire', detail: 'Hết hạn giữ căn: Đang lock → Còn hàng' });
        }
      });
      touch(h.workspace_id);
    }
    return rows.length;
  }

  /** Ghi một căn (thêm hoặc sửa), ghi nhật ký thay đổi trạng thái và giá. */
  function saveUnit(ws, project, data, userId, existing) {
    const cols = Object.keys(data);
    if (existing) {
      const changes = [];
      for (const k of cols) {
        const before = existing[UNIT_COLS[k]], after = data[k];
        if ((before ?? null) === (after ?? null) || (k === 'exclusive' && !!before === !!after)) continue;
        if (k === 'status') changes.push({ type: 'status', detail: `${before} → ${after}` });
        else if (MONEY_FIELDS.includes(k)) changes.push({ type: 'price', detail: `${FIELD_LABEL[k]}: ${ty(before)} → ${ty(after)}` });
        else changes.push({ type: 'update', detail: `${FIELD_LABEL[k]}: ${before === '' || before == null ? 'trống' : before} → ${after === '' || after == null ? 'trống' : after}` });
      }
      if (!changes.length) return { changed: false, id: existing.id };
      if ('code' in data && data.code !== existing.code) {
        const dup = db.prepare('SELECT id FROM units WHERE project_id = ? AND code = ? AND id != ?').get(project.id, data.code, existing.id);
        if (dup) fail(409, `Mã căn ${data.code} đã có trong dự án.`);
      }
      const set = cols.map((k) => `${UNIT_COLS[k]} = ?`).join(', ');
      db.prepare(`UPDATE units SET ${set}, updated_at = datetime('now'), updated_by = ? WHERE id = ?`).run(...cols.map((k) => data[k]), userId ?? null, existing.id);
      const code = data.code || existing.code;
      const merged = changes.filter((c) => c.type === 'update');
      for (const c of changes.filter((c) => c.type !== 'update')) logEvent(ws.id, { projectId: project.id, unitId: existing.id, code, userId, ...c });
      if (merged.length) logEvent(ws.id, { projectId: project.id, unitId: existing.id, code, userId, type: 'update', detail: merged.map((c) => c.detail).join('; ') });
      return { changed: true, id: existing.id };
    }
    const all = { status: STATUS.AVAILABLE, ...data };
    const keys = Object.keys(all);
    const res = db.prepare(`INSERT INTO units (workspace_id, project_id, ${keys.map((k) => UNIT_COLS[k]).join(', ')}, updated_by) VALUES (?, ?, ${keys.map(() => '?').join(', ')}, ?)`)
      .run(ws.id, project.id, ...keys.map((k) => all[k]), userId ?? null);
    logEvent(ws.id, { projectId: project.id, unitId: Number(res.lastInsertRowid), code: all.code, userId, type: 'create', detail: `Thêm căn, ${all.status}, giá ${ty(all.price)}` });
    return { changed: true, id: Number(res.lastInsertRowid) };
  }

  /**
   * Nhập danh sách căn vào dự án.
   * mode 'upsert': thêm căn mới, cập nhật căn trùng mã. 'mirror': như upsert và xóa căn không còn trong file (đồng bộ Google Sheet).
   * Chỉ ghi đè cột có trong file; trạng thái chỉ đổi khi file có cột Tình trạng.
   */
  function importUnits(ws, project, parsed, userId, mode) {
    const has = new Set(Object.keys(parsed.columns));
    const existing = new Map(db.prepare('SELECT * FROM units WHERE project_id = ?').all(project.id).map((u) => [norm(u.code).replace(/\s/g, ''), u]));
    const fresh = parsed.units.filter((u) => !existing.has(norm(u.code).replace(/\s/g, '')));
    const removing = mode === 'mirror' ? [...existing.entries()].filter(([k]) => !parsed.units.some((u) => norm(u.code).replace(/\s/g, '') === k)).map(([, u]) => u) : [];
    limitCheck(ws, 'units', fresh.length - removing.length);
    let created = 0, updated = 0;
    tx(db, () => {
      for (const u of parsed.units) {
        const ex = existing.get(norm(u.code).replace(/\s/g, ''));
        const data = { code: u.code };
        for (const k of Object.keys(UNIT_COLS)) {
          if (k === 'code' || u[k] === undefined) continue;
          // Căn đã có: chỉ ghi đè cột có trong file. Căn mới: thêm dãy (suy từ mã căn) và tình trạng mặc định.
          if (has.has(k) || (!ex && (k === 'street' || k === 'status'))) data[k] = u[k];
        }
        const clean = cleanUnit(data, { partial: !!ex });
        const res = saveUnit(ws, project, clean, userId, ex);
        if (ex && res.changed) updated++; else if (!ex) created++;
      }
      for (const u of removing) {
        db.prepare('DELETE FROM units WHERE id = ?').run(u.id);
        logEvent(ws.id, { projectId: project.id, code: u.code, userId, type: 'delete', detail: 'Không còn trong Google Sheet, đã gỡ khỏi giỏ hàng' });
      }
      logEvent(ws.id, { projectId: project.id, userId, type: 'import', detail: `Nhập dữ liệu: ${created} căn mới, ${updated} căn cập nhật${removing.length ? `, ${removing.length} căn gỡ bỏ` : ''}` });
    });
    touch(ws.id);
    return { created, updated, unchanged: parsed.units.length - created - updated, removed: removing.length, warnings: parsed.warnings.slice(0, 20) };
  }

  async function loadSource(body) {
    if (body.sheetUrl) {
      const url = sheetCsvUrl(body.sheetUrl);
      if (!url) fail(400, 'Link Google Sheet không hợp lệ. Mở sheet, bấm Chia sẻ, chọn "Bất kỳ ai có đường liên kết", rồi sao chép link.');
      let resp;
      try { resp = await fetchImpl(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) }); } catch { fail(502, 'Không tải được Google Sheet. Kiểm tra kết nối và quyền chia sẻ.'); }
      const type = resp.headers.get('content-type') || '';
      if (!resp.ok || type.includes('text/html')) fail(400, 'Google Sheet chưa chia sẻ công khai. Bấm Chia sẻ, chọn "Bất kỳ ai có đường liên kết" (người xem).');
      const text = await resp.text();
      if (text.length > SETTINGS.maxBodyBytes) fail(413, 'Google Sheet quá lớn.');
      return parseTable(text);
    }
    if (typeof body.text === 'string' && body.text.trim()) return parseTable(body.text);
    fail(400, 'Vui lòng dán bảng dữ liệu, chọn file CSV hoặc nhập link Google Sheet.');
  }

  async function syncSheet(project, ws, userId) {
    try {
      const rows = await loadSource({ sheetUrl: project.sheet_url });
      const parsed = rowsToUnits(rows);
      if (!parsed.units.length) fail(400, parsed.warnings[0] || 'Google Sheet không có căn nào.');
      const res = importUnits(ws, project, parsed, userId, 'mirror');
      db.prepare("UPDATE projects SET sheet_synced_at = datetime('now'), sheet_error = '' WHERE id = ?").run(project.id);
      return res;
    } catch (e) {
      db.prepare("UPDATE projects SET sheet_synced_at = datetime('now'), sheet_error = ? WHERE id = ?").run(str(e.message, 300), project.id);
      throw e;
    }
  }

  // ─── Xác thực ───
  function startSession(res, userId, wsId) {
    const token = createSession(db, userId, wsId);
    res.setHeader('Set-Cookie', cookie(SID, token, { maxAge: SETTINGS.sessionDays * 86400 }));
  }
  function markSuperadmin(user) {
    if (SETTINGS.superadmins.includes(user.email) && !user.is_superadmin) db.prepare('UPDATE users SET is_superadmin = 1 WHERE id = ?').run(user.id);
  }

  r.post('/api/auth/signup', async (ctx) => {
    const b = ctx.body;
    signupLimit(ctx.ip);
    const company = str(b.company, 120), name = str(b.name, 80), email = str(b.email, 120).toLowerCase(), phone = str(b.phone, 20);
    if (!company || !name) fail(400, 'Vui lòng nhập tên đơn vị và họ tên.');
    if (!isEmail(email)) fail(400, 'Email không hợp lệ.');
    if (!/^[0-9+ .]{8,20}$/.test(phone)) fail(400, 'Số điện thoại không hợp lệ.');
    checkPassword(b.password);
    if (!b.agree) fail(400, 'Vui lòng đồng ý Điều khoản sử dụng và Chính sách bảo mật.');
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) fail(409, 'Email đã được đăng ký. Vui lòng đăng nhập.');
    let slug = slugify(company), i = 1;
    while (db.prepare('SELECT 1 FROM workspaces WHERE slug = ?').get(slug)) slug = `${slugify(company).slice(0, 36)}-${++i}`;
    const ids = tx(db, () => {
      const u = db.prepare('INSERT INTO users (email, name, phone, password_hash) VALUES (?, ?, ?, ?)').run(email, name, phone, hashPassword(b.password));
      const w = db.prepare('INSERT INTO workspaces (name, slug, brand_name, company_name, hotline, plan, trial_ends_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(company, slug, company, company, phone, 'trial', plusDays(PLANS.trial.days));
      db.prepare("INSERT INTO memberships (workspace_id, user_id, role) VALUES (?, ?, 'owner')").run(w.lastInsertRowid, u.lastInsertRowid);
      return { userId: Number(u.lastInsertRowid), wsId: Number(w.lastInsertRowid) };
    });
    markSuperadmin({ id: ids.userId, email, is_superadmin: 0 });
    logEvent(ids.wsId, { userId: ids.userId, type: 'account', detail: `Tạo tài khoản đơn vị, dùng thử ${PLANS.trial.days} ngày` });
    startSession(ctx.res, ids.userId, ids.wsId);
    return { ok: true };
  });

  r.post('/api/auth/login', async (ctx) => {
    const email = str(ctx.body.email, 120).toLowerCase();
    loginLimit(ctx.ip + '|' + email);
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!u || !verifyPassword(ctx.body.password, u.password_hash)) fail(401, 'Email hoặc mật khẩu không đúng.');
    markSuperadmin(u);
    startSession(ctx.res, u.id, null);
    return { ok: true };
  });

  r.post('/api/auth/logout', async (ctx) => {
    if (ctx.session) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(ctx.session.tokenHash);
    ctx.res.setHeader('Set-Cookie', cookie(SID, '', { maxAge: 0 }));
    return { ok: true };
  });

  r.get('/api/me', async (ctx) => {
    if (!ctx.session) return { user: null, product: PRODUCT };
    const { user, workspace: ws, role } = ctx.session;
    const list = db.prepare('SELECT w.id, w.name, m.role FROM memberships m JOIN workspaces w ON w.id = m.workspace_id WHERE m.user_id = ? ORDER BY w.name').all(user.id);
    const pending = ws && ROLE_RANK[role] >= 2 ? db.prepare("SELECT COUNT(*) n FROM holds WHERE workspace_id = ? AND status = 'pending'").get(ws.id).n : 0;
    return {
      product: PRODUCT, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, superadmin: !!user.is_superadmin },
      role, roleName: ROLE_NAME[role], workspaces: list, pendingHolds: pending,
      workspace: ws && { id: ws.id, name: ws.name, slug: ws.slug, brandName: ws.brand_name, color: ws.color, logoUrl: ws.logo_url, status: ws.status, subscription: subscription(ws) },
      statuses: STATUS_LIST
    };
  });

  r.post('/api/me/workspace', async (ctx) => {
    if (!ctx.session) fail(401, 'Vui lòng đăng nhập.');
    const id = Number(ctx.body.id);
    if (!db.prepare('SELECT 1 FROM memberships WHERE workspace_id = ? AND user_id = ?').get(id, ctx.session.user.id)) fail(403, 'Bạn không thuộc đơn vị này.');
    db.prepare('UPDATE sessions SET workspace_id = ? WHERE token_hash = ?').run(id, ctx.session.tokenHash);
    return { ok: true };
  });

  r.put('/api/me', async (ctx) => {
    if (!ctx.session) fail(401, 'Vui lòng đăng nhập.');
    const b = ctx.body, uid = ctx.session.user.id;
    if (b.name !== undefined) { const n = str(b.name, 80); if (!n) fail(400, 'Vui lòng nhập họ tên.'); db.prepare('UPDATE users SET name = ? WHERE id = ?').run(n, uid); }
    if (b.phone !== undefined) db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(str(b.phone, 20), uid);
    if (b.newPassword) {
      const u = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(uid);
      if (!verifyPassword(b.currentPassword, u.password_hash)) fail(400, 'Mật khẩu hiện tại không đúng.');
      checkPassword(b.newPassword);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(b.newPassword), uid);
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(uid, ctx.session.tokenHash);
    }
    return { ok: true };
  });

  // Mời thành viên: tạo link dùng một lần, hạn 7 ngày.
  r.post('/api/invites', async (ctx) => {
    const s = need(ctx, 'admin');
    const role = ctx.body.role === 'admin' ? 'admin' : 'sale';
    if (role === 'admin' && s.role !== 'owner') fail(403, 'Chỉ chủ tài khoản được mời quản trị viên.');
    limitCheck(s.workspace, 'members', 1);
    const token = newToken();
    db.prepare('INSERT INTO invites (token_hash, workspace_id, role, created_by, expires_at) VALUES (?, ?, ?, ?, ?)').run(sha(token), s.workspace.id, role, s.user.id, plusDays(7));
    return { link: `${ctx.base}/app/#/moi/${token}`, role, roleName: ROLE_NAME[role], expiresInDays: 7 };
  });

  const getInvite = (token) => {
    const inv = db.prepare('SELECT i.*, w.name ws_name FROM invites i JOIN workspaces w ON w.id = i.workspace_id WHERE token_hash = ?').get(sha(token));
    if (!inv || inv.used_at || inv.expires_at < new Date().toISOString()) fail(404, 'Link mời không còn hiệu lực. Vui lòng xin link mới.');
    return inv;
  };
  r.get('/api/invites/:token', async (ctx) => {
    const inv = getInvite(ctx.params.token);
    return { workspace: inv.ws_name, role: inv.role, roleName: ROLE_NAME[inv.role], loggedIn: !!ctx.session, email: ctx.session?.user.email || '' };
  });
  r.post('/api/invites/:token/accept', async (ctx) => {
    const inv = getInvite(ctx.params.token), b = ctx.body;
    let userId;
    if (ctx.session) userId = ctx.session.user.id;
    else {
      const email = str(b.email, 120).toLowerCase(), name = str(b.name, 80);
      if (!isEmail(email) || !name) fail(400, 'Vui lòng nhập họ tên và email hợp lệ.');
      const ex = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (ex) {
        loginLimit(ctx.ip + '|' + email);
        if (!verifyPassword(b.password, ex.password_hash)) fail(401, 'Email đã có tài khoản. Nhập đúng mật khẩu của tài khoản đó để nhận lời mời.');
        userId = ex.id;
      } else {
        checkPassword(b.password);
        userId = Number(db.prepare('INSERT INTO users (email, name, phone, password_hash) VALUES (?, ?, ?, ?)').run(email, name, str(b.phone, 20), hashPassword(b.password)).lastInsertRowid);
      }
    }
    const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(inv.workspace_id);
    if (!db.prepare('SELECT 1 FROM memberships WHERE workspace_id = ? AND user_id = ?').get(ws.id, userId)) {
      limitCheck(ws, 'members', 1);
      db.prepare('INSERT INTO memberships (workspace_id, user_id, role) VALUES (?, ?, ?)').run(ws.id, userId, inv.role);
      logEvent(ws.id, { userId, type: 'member', detail: `Thành viên mới nhận lời mời (${ROLE_NAME[inv.role]})` });
    }
    db.prepare("UPDATE invites SET used_by = ?, used_at = datetime('now') WHERE token_hash = ?").run(userId, inv.token_hash);
    if (ctx.session) db.prepare('UPDATE sessions SET workspace_id = ? WHERE token_hash = ?').run(ws.id, ctx.session.tokenHash);
    else startSession(ctx.res, userId, ws.id);
    return { ok: true };
  });

  // Đặt lại mật khẩu bằng link do quản trị tạo (chưa có gửi email tự động).
  r.post('/api/reset/:token', async (ctx) => {
    const t = db.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(sha(ctx.params.token));
    if (!t || t.used_at || t.expires_at < new Date().toISOString()) fail(404, 'Link đặt lại mật khẩu không còn hiệu lực.');
    checkPassword(ctx.body.password);
    tx(db, () => {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(ctx.body.password), t.user_id);
      db.prepare("UPDATE password_resets SET used_at = datetime('now') WHERE token_hash = ?").run(t.token_hash);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(t.user_id);
    });
    return { ok: true };
  });
  const resetLink = (ctx, userId) => {
    const token = newToken();
    db.prepare('INSERT INTO password_resets (token_hash, user_id, created_by, expires_at) VALUES (?, ?, ?, ?)').run(sha(token), userId, ctx.session.user.id, plusDays(2));
    return `${ctx.base}/app/#/dat-lai-mat-khau/${token}`;
  };

  // ─── Đơn vị, thành viên ───
  const wsDto = (ws) => ({
    id: ws.id, name: ws.name, slug: ws.slug, brandName: ws.brand_name, color: ws.color, logoUrl: ws.logo_url, hotline: ws.hotline, zalo: ws.zalo,
    companyName: ws.company_name, address: ws.address, taxCode: ws.tax_code, showSold: !!ws.show_sold, status: ws.status
  });
  r.get('/api/workspace', async (ctx) => {
    const s = need(ctx);
    const ws = s.workspace;
    return {
      workspace: wsDto(ws), subscription: subscription(ws),
      usage: { projects: db.prepare('SELECT COUNT(*) n FROM projects WHERE workspace_id = ?').get(ws.id).n, units: countUnits(ws.id),
        members: db.prepare('SELECT COUNT(*) n FROM memberships WHERE workspace_id = ?').get(ws.id).n },
      publicUrl: `${ctx.base}/b/${ws.slug}`,
      embed: `<div data-adl-bang-hang></div>\n<script src="${ctx.base}/embed/${ws.slug}.js" async></script>`
    };
  });
  r.put('/api/workspace', async (ctx) => {
    const s = need(ctx, 'admin'), b = ctx.body, ws = s.workspace;
    const up = {};
    if (b.name !== undefined) { up.name = str(b.name, 120); if (!up.name) fail(400, 'Vui lòng nhập tên đơn vị.'); }
    if (b.brandName !== undefined) up.brand_name = str(b.brandName, 60);
    if (b.color !== undefined) { if (!/^#[0-9a-fA-F]{6}$/.test(b.color)) fail(400, 'Màu không hợp lệ.'); up.color = b.color; }
    if (b.logoUrl !== undefined) up.logo_url = b.logoUrl ? httpsUrl(b.logoUrl) || fail(400, 'Link logo cần bắt đầu bằng https://') : '';
    if (b.hotline !== undefined) up.hotline = str(b.hotline, 20);
    if (b.zalo !== undefined) up.zalo = b.zalo ? httpsUrl(b.zalo) || fail(400, 'Link Zalo cần bắt đầu bằng https://') : '';
    for (const [k, c, n] of [['companyName', 'company_name', 160], ['address', 'address', 250], ['taxCode', 'tax_code', 20]]) if (b[k] !== undefined) up[c] = str(b[k], n);
    if (b.showSold !== undefined) up.show_sold = b.showSold ? 1 : 0;
    if (b.slug !== undefined && b.slug !== ws.slug) {
      if (s.role !== 'owner') fail(403, 'Chỉ chủ tài khoản được đổi địa chỉ bảng hàng.');
      const slug = slugify(b.slug);
      if (db.prepare('SELECT 1 FROM workspaces WHERE slug = ? AND id != ?').get(slug, ws.id)) fail(409, 'Địa chỉ này đã có đơn vị khác dùng.');
      up.slug = slug;
    }
    const keys = Object.keys(up);
    if (keys.length) db.prepare(`UPDATE workspaces SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => up[k]), ws.id);
    touch(ws.id);
    return { ok: true };
  });

  r.get('/api/members', async (ctx) => {
    const s = need(ctx);
    const list = db.prepare('SELECT u.id, u.name, u.email, u.phone, m.role, m.created_at FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.workspace_id = ? ORDER BY m.created_at')
      .all(s.workspace.id).map((m) => ({ ...m, roleName: ROLE_NAME[m.role], email: ROLE_RANK[s.role] >= 2 || m.id === s.user.id ? m.email : '' }));
    return { members: list, limit: subscription(s.workspace).limits.members };
  });
  r.put('/api/members/:uid', async (ctx) => {
    const s = need(ctx, 'owner'), uid = Number(ctx.params.uid);
    const role = ['admin', 'sale', 'owner'].includes(ctx.body.role) ? ctx.body.role : fail(400, 'Vai trò không hợp lệ.');
    const m = db.prepare('SELECT * FROM memberships WHERE workspace_id = ? AND user_id = ?').get(s.workspace.id, uid) || fail(404, 'Không tìm thấy thành viên.');
    if (uid === s.user.id) fail(400, 'Không thể tự đổi vai trò của mình.');
    tx(db, () => {
      if (role === 'owner') db.prepare("UPDATE memberships SET role = 'admin' WHERE workspace_id = ? AND user_id = ?").run(s.workspace.id, s.user.id); // chuyển quyền chủ
      db.prepare('UPDATE memberships SET role = ? WHERE workspace_id = ? AND user_id = ?').run(role, s.workspace.id, uid);
    });
    logEvent(s.workspace.id, { userId: s.user.id, type: 'member', detail: `Đổi vai trò thành viên #${uid}: ${ROLE_NAME[m.role]} → ${ROLE_NAME[role]}` });
    return { ok: true };
  });
  r.del('/api/members/:uid', async (ctx) => {
    const s = need(ctx, 'admin'), uid = Number(ctx.params.uid);
    const m = db.prepare('SELECT * FROM memberships WHERE workspace_id = ? AND user_id = ?').get(s.workspace.id, uid) || fail(404, 'Không tìm thấy thành viên.');
    if (m.role === 'owner') fail(400, 'Không thể gỡ chủ tài khoản.');
    if (s.role === 'admin' && m.role !== 'sale') fail(403, 'Quản trị viên chỉ gỡ được nhân viên kinh doanh.');
    db.prepare('DELETE FROM memberships WHERE workspace_id = ? AND user_id = ?').run(s.workspace.id, uid);
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND workspace_id = ?').run(uid, s.workspace.id);
    logEvent(s.workspace.id, { userId: s.user.id, type: 'member', detail: `Gỡ thành viên #${uid}` });
    return { ok: true };
  });
  r.post('/api/members/:uid/reset', async (ctx) => {
    const s = need(ctx, 'admin'), uid = Number(ctx.params.uid);
    const m = db.prepare('SELECT * FROM memberships WHERE workspace_id = ? AND user_id = ?').get(s.workspace.id, uid) || fail(404, 'Không tìm thấy thành viên.');
    if (ROLE_RANK[m.role] >= ROLE_RANK[s.role] && uid !== s.user.id) fail(403, 'Bạn không thể đặt lại mật khẩu cho tài khoản này.');
    return { link: resetLink(ctx, uid), expiresInDays: 2 };
  });

  // ─── Dự án, căn ───
  r.get('/api/projects', async (ctx) => {
    const s = need(ctx);
    expireHolds(s.workspace.id);
    const rows = db.prepare('SELECT * FROM projects WHERE workspace_id = ? ORDER BY sort, id').all(s.workspace.id);
    const counts = db.prepare('SELECT project_id, status, COUNT(*) n FROM units WHERE workspace_id = ? GROUP BY project_id, status').all(s.workspace.id);
    return {
      projects: rows.map((p) => {
        const by = {}; let total = 0;
        for (const c of counts) if (c.project_id === p.id) { by[c.status] = c.n; total += c.n; }
        return { id: p.id, name: p.name, pageUrl: p.page_url, isPublic: !!p.is_public, sort: p.sort, sheetUrl: ROLE_RANK[s.role] >= 2 ? p.sheet_url : '',
          sheetSyncedAt: p.sheet_synced_at, sheetError: p.sheet_error, total, byStatus: by };
      })
    };
  });
  const projectInput = (b, partial) => {
    const out = {};
    if (!partial || b.name !== undefined) { out.name = str(b.name, 120); if (!out.name) fail(400, 'Vui lòng nhập tên dự án.'); }
    if (b.pageUrl !== undefined) out.page_url = b.pageUrl ? httpsUrl(b.pageUrl) || fail(400, 'Link trang dự án cần bắt đầu bằng https://') : '';
    if (b.isPublic !== undefined) out.is_public = b.isPublic ? 1 : 0;
    if (b.sort !== undefined) out.sort = Number(b.sort) || 0;
    if (b.sheetUrl !== undefined) out.sheet_url = b.sheetUrl ? (sheetCsvUrl(b.sheetUrl) ? str(b.sheetUrl, 1000) : fail(400, 'Link Google Sheet không hợp lệ.')) : '';
    return out;
  };
  r.post('/api/projects', async (ctx) => {
    const s = need(ctx, 'admin'); needActive(s.workspace); limitCheck(s.workspace, 'projects', 1);
    const d = projectInput(ctx.body, false), keys = Object.keys(d);
    const res = db.prepare(`INSERT INTO projects (workspace_id, ${keys.join(', ')}) VALUES (?, ${keys.map(() => '?').join(', ')})`).run(s.workspace.id, ...keys.map((k) => d[k]));
    logEvent(s.workspace.id, { projectId: Number(res.lastInsertRowid), userId: s.user.id, type: 'project', detail: `Tạo dự án ${d.name}` });
    touch(s.workspace.id);
    return { id: Number(res.lastInsertRowid) };
  });
  r.put('/api/projects/:id', async (ctx) => {
    const s = need(ctx, 'admin'); needActive(s.workspace);
    const p = getProject(s.workspace.id, ctx.params.id), d = projectInput(ctx.body, true), keys = Object.keys(d);
    if (keys.length) db.prepare(`UPDATE projects SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => d[k]), p.id);
    touch(s.workspace.id);
    return { ok: true };
  });
  r.del('/api/projects/:id', async (ctx) => {
    const s = need(ctx, 'admin');
    const p = getProject(s.workspace.id, ctx.params.id);
    if (str(ctx.body.confirm) !== p.name) fail(400, 'Nhập đúng tên dự án để xác nhận xóa.');
    db.prepare('DELETE FROM projects WHERE id = ?').run(p.id);
    logEvent(s.workspace.id, { userId: s.user.id, type: 'project', detail: `Xóa dự án ${p.name}` });
    touch(s.workspace.id);
    return { ok: true };
  });

  r.get('/api/projects/:id/units', async (ctx) => {
    const s = need(ctx);
    expireHolds(s.workspace.id);
    const p = getProject(s.workspace.id, ctx.params.id);
    const units = db.prepare('SELECT * FROM units WHERE project_id = ? ORDER BY code').all(p.id).map(unitDto);
    const holds = db.prepare(`SELECT h.id, h.unit_id, h.status, h.customer, h.expires_at, u.name requester, h.requested_by FROM holds h JOIN users u ON u.id = h.requested_by
      WHERE h.workspace_id = ? AND h.status IN ('pending','approved') AND h.unit_id IN (SELECT id FROM units WHERE project_id = ?)`).all(s.workspace.id, p.id);
    const hmap = {};
    for (const h of holds) hmap[h.unit_id] = { id: h.id, status: h.status, expiresAt: h.expires_at, requester: h.requester, mine: h.requested_by === s.user.id,
      customer: ROLE_RANK[s.role] >= 2 || h.requested_by === s.user.id ? h.customer : '' };
    return { project: { id: p.id, name: p.name }, units: units.map((u) => ({ ...u, hold: hmap[u.id] || null })) };
  });
  r.post('/api/projects/:id/units', async (ctx) => {
    const s = need(ctx, 'admin'); needActive(s.workspace); limitCheck(s.workspace, 'units', 1);
    const p = getProject(s.workspace.id, ctx.params.id), data = cleanUnit(ctx.body);
    if (db.prepare('SELECT 1 FROM units WHERE project_id = ? AND code = ?').get(p.id, data.code)) fail(409, `Mã căn ${data.code} đã có trong dự án.`);
    const res = saveUnit(s.workspace, p, data, s.user.id, null);
    touch(s.workspace.id);
    return { id: res.id };
  });
  r.put('/api/units/:id', async (ctx) => {
    const s = need(ctx, 'admin'); needActive(s.workspace);
    const u = getUnit(s.workspace.id, ctx.params.id), p = getProject(s.workspace.id, u.project_id);
    const res = saveUnit(s.workspace, p, cleanUnit(ctx.body, { partial: true }), s.user.id, u);
    touch(s.workspace.id);
    return { ok: true, changed: res.changed };
  });
  r.post('/api/projects/:id/bulk', async (ctx) => {
    const s = need(ctx, 'admin'); needActive(s.workspace);
    const p = getProject(s.workspace.id, ctx.params.id);
    const ids = (Array.isArray(ctx.body.ids) ? ctx.body.ids : []).map(Number).filter(Boolean).slice(0, 5000);
    if (!ids.length) fail(400, 'Chưa chọn căn nào.');
    const units = ids.map((id) => db.prepare('SELECT * FROM units WHERE id = ? AND project_id = ?').get(id, p.id)).filter(Boolean);
    let n = 0;
    tx(db, () => {
      if (ctx.body.action === 'delete') {
        for (const u of units) { db.prepare('DELETE FROM units WHERE id = ?').run(u.id); logEvent(s.workspace.id, { projectId: p.id, code: u.code, userId: s.user.id, type: 'delete', detail: 'Xóa căn' }); n++; }
      } else {
        const data = cleanUnit({ status: ctx.body.status }, { partial: true });
        for (const u of units) if (saveUnit(s.workspace, p, data, s.user.id, u).changed) n++;
      }
    });
    touch(s.workspace.id);
    return { ok: true, count: n };
  });

  r.post('/api/projects/:id/import/preview', async (ctx) => {
    const s = need(ctx, 'admin');
    const p = getProject(s.workspace.id, ctx.params.id);
    const parsed = rowsToUnits(await loadSource(ctx.body));
    const codes = new Set(db.prepare('SELECT code FROM units WHERE project_id = ?').all(p.id).map((u) => norm(u.code).replace(/\s/g, '')));
    const fresh = parsed.units.filter((u) => !codes.has(norm(u.code).replace(/\s/g, ''))).length;
    return { columns: Object.fromEntries(Object.entries(parsed.columns).map(([k, v]) => [k, { header: v, label: FIELD_LABEL[k] || k }])),
      total: parsed.units.length, fresh, existing: parsed.units.length - fresh, sample: parsed.units.slice(0, 8), warnings: parsed.warnings.slice(0, 20) };
  });
  r.post('/api/projects/:id/import', async (ctx) => {
    const s = need(ctx, 'admin'); needActive(s.workspace);
    const p = getProject(s.workspace.id, ctx.params.id);
    const parsed = rowsToUnits(await loadSource(ctx.body));
    if (!parsed.units.length) fail(400, parsed.warnings[0] || 'Không đọc được căn nào từ dữ liệu.');
    return importUnits(s.workspace, p, parsed, s.user.id, 'upsert');
  });
  r.post('/api/projects/:id/sync', async (ctx) => {
    const s = need(ctx, 'admin'); needActive(s.workspace);
    const p = getProject(s.workspace.id, ctx.params.id);
    if (!p.sheet_url) fail(400, 'Dự án chưa gắn link Google Sheet.');
    return syncSheet(p, s.workspace, s.user.id);
  });

  // ─── Giữ căn ───
  r.post('/api/units/:id/hold', async (ctx) => {
    const s = need(ctx); needActive(s.workspace);
    const u = getUnit(s.workspace.id, ctx.params.id);
    if (u.status !== STATUS.AVAILABLE) fail(409, `Căn ${u.code} đang ở trạng thái ${u.status}, không xin giữ được.`);
    if (db.prepare("SELECT 1 FROM holds WHERE unit_id = ? AND status IN ('pending','approved')").get(u.id)) fail(409, 'Căn đã có yêu cầu giữ đang chờ duyệt.');
    const customer = str(ctx.body.customer, 120), note = str(ctx.body.note, 500);
    const id = tx(db, () => {
      const res = db.prepare('INSERT INTO holds (workspace_id, unit_id, requested_by, customer, note, prev_status) VALUES (?, ?, ?, ?, ?, ?)').run(s.workspace.id, u.id, s.user.id, customer, note, u.status);
      db.prepare("UPDATE units SET status = ?, updated_at = datetime('now'), updated_by = ? WHERE id = ?").run(STATUS.CHECK, s.user.id, u.id);
      logEvent(s.workspace.id, { projectId: u.project_id, unitId: u.id, code: u.code, userId: s.user.id, type: 'hold_request', detail: `Xin giữ căn${customer ? ' cho khách ' + customer : ''}: Còn hàng → Check admin` });
      return Number(res.lastInsertRowid);
    });
    touch(s.workspace.id);
    return { id };
  });
  r.get('/api/holds', async (ctx) => {
    const s = need(ctx);
    expireHolds(s.workspace.id);
    const mineOnly = ROLE_RANK[s.role] < 2;
    const rows = db.prepare(`SELECT h.*, u.code, u.price, u.project_id, p.name project, us.name requester, d.name decider FROM holds h
      JOIN units u ON u.id = h.unit_id JOIN projects p ON p.id = u.project_id JOIN users us ON us.id = h.requested_by LEFT JOIN users d ON d.id = h.decided_by
      WHERE h.workspace_id = ? ${mineOnly ? 'AND h.requested_by = ?' : ''} ORDER BY CASE h.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, h.id DESC LIMIT 300`)
      .all(...(mineOnly ? [s.workspace.id, s.user.id] : [s.workspace.id]));
    return { holds: rows.map((h) => ({ id: h.id, unitId: h.unit_id, code: h.code, price: h.price, projectId: h.project_id, project: h.project, requester: h.requester,
      customer: h.customer, note: h.note, status: h.status, decider: h.decider, decidedAt: h.decided_at, expiresAt: h.expires_at, createdAt: h.created_at })) };
  });
  const decide = (action) => async (ctx) => {
    const s = need(ctx, 'admin'); needActive(s.workspace);
    const h = db.prepare('SELECT h.*, u.code, u.project_id, u.status ustatus FROM holds h JOIN units u ON u.id = h.unit_id WHERE h.id = ? AND h.workspace_id = ?').get(Number(ctx.params.id), s.workspace.id) || fail(404, 'Không tìm thấy yêu cầu.');
    const ev = (type, detail) => logEvent(s.workspace.id, { projectId: h.project_id, unitId: h.unit_id, code: h.code, userId: s.user.id, type, detail });
    const setUnit = (st) => db.prepare("UPDATE units SET status = ?, updated_at = datetime('now'), updated_by = ? WHERE id = ?").run(st, s.user.id, h.unit_id);
    tx(db, () => {
      if (action === 'approve') {
        if (h.status !== 'pending') fail(409, 'Yêu cầu đã được xử lý.');
        const hours = Math.min(Math.max(Number(ctx.body.hours) || SETTINGS.holdHours, 1), 24 * 30);
        db.prepare("UPDATE holds SET status = 'approved', decided_by = ?, decided_at = datetime('now'), expires_at = ? WHERE id = ?").run(s.user.id, plusDays(hours / 24), h.id);
        setUnit(STATUS.LOCKED); ev('hold_approve', `Duyệt giữ căn ${hours} giờ: ${h.ustatus} → Đang lock`);
      } else if (action === 'reject') {
        if (h.status !== 'pending') fail(409, 'Yêu cầu đã được xử lý.');
        db.prepare("UPDATE holds SET status = 'rejected', decided_by = ?, decided_at = datetime('now') WHERE id = ?").run(s.user.id, h.id);
        if (h.ustatus === STATUS.CHECK) setUnit(h.prev_status || STATUS.AVAILABLE);
        ev('hold_reject', `Từ chối giữ căn${str(ctx.body.reason) ? ': ' + str(ctx.body.reason, 200) : ''}`);
      } else {
        if (h.status !== 'approved') fail(409, 'Chỉ trả được căn đang giữ.');
        db.prepare("UPDATE holds SET status = 'released', decided_by = ?, decided_at = datetime('now') WHERE id = ?").run(s.user.id, h.id);
        if (h.ustatus === STATUS.LOCKED) setUnit(STATUS.AVAILABLE);
        ev('hold_release', 'Trả căn: Đang lock → Còn hàng');
      }
    });
    touch(s.workspace.id);
    return { ok: true };
  };
  r.post('/api/holds/:id/approve', decide('approve'));
  r.post('/api/holds/:id/reject', decide('reject'));
  r.post('/api/holds/:id/release', decide('release'));

  r.get('/api/events', async (ctx) => {
    const s = need(ctx);
    const q = ctx.query, args = [s.workspace.id];
    let where = 'e.workspace_id = ?';
    if (q.get('project')) { where += ' AND e.project_id = ?'; args.push(Number(q.get('project'))); }
    if (q.get('type')) { where += ' AND e.type LIKE ?'; args.push(str(q.get('type'), 20) + '%'); }
    if (q.get('before')) { where += ' AND e.id < ?'; args.push(Number(q.get('before'))); }
    const rows = db.prepare(`SELECT e.*, u.name user, p.name project FROM events e LEFT JOIN users u ON u.id = e.user_id LEFT JOIN projects p ON p.id = e.project_id WHERE ${where} ORDER BY e.id DESC LIMIT 100`).all(...args);
    return { events: rows.map((e) => ({ id: e.id, type: e.type, code: e.unit_code, unitId: e.unit_id, projectId: e.project_id, project: e.project, user: e.user, detail: e.detail, at: e.created_at })) };
  });

  // ─── Thanh toán ───
  const qrUrl = (amount, ref) => `https://img.vietqr.io/image/${BANK.bin}-${BANK.account}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(ref)}&accountName=${encodeURIComponent(BANK.holder)}`;
  const priceFor = (plan, months) => PLANS[plan].price * (months === 12 ? YEARLY_MONTHS_CHARGED : months);
  r.get('/api/billing', async (ctx) => {
    const s = need(ctx);
    const pays = db.prepare('SELECT * FROM payments WHERE workspace_id = ? ORDER BY id DESC LIMIT 50').all(s.workspace.id);
    return {
      subscription: subscription(s.workspace), canPay: s.role === 'owner',
      plans: Object.entries(PLANS).filter(([, p]) => !p.hidden).map(([id, p]) => ({ id, ...p })), yearlyMonthsCharged: YEARLY_MONTHS_CHARGED,
      bank: { name: BANK.name, account: BANK.account, holder: BANK.holder },
      payments: pays.map((p) => ({ id: p.id, plan: p.plan, planName: PLANS[p.plan]?.name, months: p.months, amount: p.amount, ref: p.ref, status: p.status, createdAt: p.created_at, confirmedAt: p.confirmed_at,
        qr: p.status === 'pending' ? qrUrl(p.amount, p.ref) : '' })),
      support: { phone: PRODUCT.supportPhone, zalo: PRODUCT.supportZalo }
    };
  });
  r.post('/api/billing/orders', async (ctx) => {
    const s = need(ctx, 'owner');
    const plan = ctx.body.plan, months = Number(ctx.body.months);
    if (!PLANS[plan] || PLANS[plan].hidden || PLANS[plan].price == null) fail(400, 'Gói này cần liên hệ để báo giá.');
    if (![1, 3, 6, 12].includes(months)) fail(400, 'Thời hạn không hợp lệ.');
    const amount = priceFor(plan, months);
    const res = db.prepare('INSERT INTO payments (workspace_id, plan, months, amount, ref, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(s.workspace.id, plan, months, amount, 'tmp-' + newToken(), s.user.id);
    const id = Number(res.lastInsertRowid), ref = `GH${s.workspace.id}N${id}`;
    db.prepare('UPDATE payments SET ref = ? WHERE id = ?').run(ref, id);
    return { id, ref, amount, qr: qrUrl(amount, ref) };
  });

  // ─── Quản trị hệ thống ───
  const needSuper = (ctx) => { if (!ctx.session?.user.is_superadmin) fail(403, 'Chỉ quản trị hệ thống.'); return ctx.session; };
  r.get('/api/admin/overview', async (ctx) => {
    needSuper(ctx);
    const ws = db.prepare(`SELECT w.*, (SELECT COUNT(*) FROM units u WHERE u.workspace_id = w.id) units, (SELECT COUNT(*) FROM projects p WHERE p.workspace_id = w.id) projects,
      (SELECT COUNT(*) FROM memberships m WHERE m.workspace_id = w.id) members,
      (SELECT us.email || ' · ' || us.name || ' · ' || us.phone FROM memberships m JOIN users us ON us.id = m.user_id WHERE m.workspace_id = w.id AND m.role = 'owner' LIMIT 1) owner
      FROM workspaces w ORDER BY w.id DESC`).all();
    const pays = db.prepare("SELECT p.*, w.name ws FROM payments p JOIN workspaces w ON w.id = p.workspace_id ORDER BY CASE p.status WHEN 'pending' THEN 0 ELSE 1 END, p.id DESC LIMIT 200").all();
    return {
      workspaces: ws.map((w) => ({ id: w.id, name: w.name, slug: w.slug, owner: w.owner, units: w.units, projects: w.projects, members: w.members, createdAt: w.created_at, status: w.status, subscription: subscription(w) })),
      payments: pays.map((p) => ({ id: p.id, workspace: p.ws, workspaceId: p.workspace_id, plan: p.plan, planName: PLANS[p.plan]?.name, months: p.months, amount: p.amount, ref: p.ref, status: p.status, createdAt: p.created_at })),
      plans: Object.entries(PLANS).map(([id, p]) => ({ id, name: p.name }))
    };
  });
  r.post('/api/admin/payments/:id/confirm', async (ctx) => {
    const s = needSuper(ctx);
    const p = db.prepare('SELECT * FROM payments WHERE id = ?').get(Number(ctx.params.id)) || fail(404, 'Không tìm thấy thanh toán.');
    if (p.status !== 'pending') fail(409, 'Thanh toán đã xử lý.');
    const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(p.workspace_id);
    const from = ws.paid_until && ws.paid_until > new Date().toISOString() && ws.plan === p.plan ? new Date(ws.paid_until).getTime() : Date.now();
    const until = new Date(from); until.setMonth(until.getMonth() + p.months);
    tx(db, () => {
      db.prepare("UPDATE payments SET status = 'paid', confirmed_by = ?, confirmed_at = datetime('now') WHERE id = ?").run(s.user.id, p.id);
      db.prepare('UPDATE workspaces SET plan = ?, paid_until = ? WHERE id = ?').run(p.plan, until.toISOString(), ws.id);
    });
    logEvent(ws.id, { type: 'billing', detail: `Đã nhận thanh toán ${money(p.amount)}đ (${p.ref}), gói ${PLANS[p.plan].name} đến ${until.toLocaleDateString('vi-VN')}` });
    touch(ws.id);
    return { ok: true, paidUntil: until.toISOString() };
  });
  r.post('/api/admin/payments/:id/cancel', async (ctx) => {
    needSuper(ctx);
    db.prepare("UPDATE payments SET status = 'cancelled' WHERE id = ? AND status = 'pending'").run(Number(ctx.params.id));
    return { ok: true };
  });
  r.put('/api/admin/workspaces/:id', async (ctx) => {
    needSuper(ctx);
    const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(Number(ctx.params.id)) || fail(404, 'Không tìm thấy đơn vị.');
    const b = ctx.body;
    if (b.plan !== undefined && !PLANS[b.plan]) fail(400, 'Gói không hợp lệ.');
    if (b.status !== undefined && !['active', 'suspended'].includes(b.status)) fail(400, 'Trạng thái không hợp lệ.');
    const up = {};
    if (b.plan) up.plan = b.plan;
    if (b.status) up.status = b.status;
    if (b.paidUntil !== undefined) up.paid_until = b.paidUntil ? new Date(b.paidUntil).toISOString() : null;
    if (b.trialDays) up.trial_ends_at = plusDays(Math.min(Number(b.trialDays), 90));
    const keys = Object.keys(up);
    if (keys.length) db.prepare(`UPDATE workspaces SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => up[k]), ws.id);
    logEvent(ws.id, { type: 'billing', detail: `Quản trị hệ thống cập nhật: ${JSON.stringify(up)}` });
    touch(ws.id);
    return { ok: true };
  });
  r.post('/api/admin/workspaces/:id/reset-owner', async (ctx) => {
    needSuper(ctx);
    const m = db.prepare("SELECT user_id FROM memberships WHERE workspace_id = ? AND role = 'owner'").get(Number(ctx.params.id)) || fail(404, 'Không tìm thấy chủ tài khoản.');
    return { link: resetLink(ctx, m.user_id), expiresInDays: 2 };
  });

  // ─── Bảng hàng công khai ───
  function publicData(ws) {
    const sub = subscription(ws);
    if (!sub.publicActive) return { ok: false, error: 'Bảng hàng đang tạm ngưng.' };
    const cached = pubCache.get(ws.slug);
    if (cached && Date.now() - cached.at < 30000) return cached.body;
    expireHolds(ws.id);
    const projects = db.prepare('SELECT * FROM projects WHERE workspace_id = ? AND is_public = 1 ORDER BY sort, id').all(ws.id);
    let latest = '', anyDq = false;
    const out = projects.map((p) => {
      const units = db.prepare('SELECT * FROM units WHERE project_id = ?').all(p.id)
        .filter((u) => ws.show_sold || u.status !== STATUS.SOLD)
        .map((u) => {
          if (u.updated_at > latest) latest = u.updated_at;
          if (u.exclusive) anyDq = true;
          const o = { code: u.code, zone: u.zone, street: u.street, type: u.type, direction: u.direction, handover: u.handover, land: u.land, build: u.build,
            price: u.price, status: PUBLIC_STATUS[u.status] || 'Liên hệ' };
          if (/^https:\/\//.test(u.ptg)) o.ptg = u.ptg;
          if (/^https:\/\//.test(u.unit_link)) o.unitLink = u.unit_link;
          for (const [k, c] of [['priceExVat', 'price_ex_vat'], ['priceLoan', 'price_loan'], ['priceEarly', 'price_early'], ['priceProgress', 'price_progress']]) if (u[c]) o[k] = u[c];
          if (u.fund) o.fund = u.fund;
          if (u.exclusive) o.dq = 1;
          return o;
        });
      return { id: 'P' + p.id, name: p.name, units };
    });
    const brand = ws.brand_name || ws.name;
    const body = {
      ok: true, updatedAt: latest ? new Date(latest.replace(' ', 'T') + 'Z').toISOString() : new Date().toISOString(),
      company: { name: ws.company_name || ws.name, hotline: ws.hotline, zalo: ws.zalo },
      exclusiveTab: anyDq ? { enabled: true, short: 'ĐQ', label: 'ĐQ ' + brand, title: 'Giỏ hàng độc quyền ' + brand } : null,
      projects: out
    };
    pubCache.set(ws.slug, { at: Date.now(), body, wsId: ws.id });
    return body;
  }
  const wsBySlug = (slug) => db.prepare('SELECT * FROM workspaces WHERE slug = ?').get(String(slug).toLowerCase());

  r.get('/api/public/:slug', async (ctx) => {
    const ws = wsBySlug(ctx.params.slug);
    const body = ws ? publicData(ws) : { ok: false, error: 'Không tìm thấy bảng hàng.' };
    const cb = ctx.query.get('callback');
    const headers = { 'Cache-Control': 'public, max-age=30', 'Access-Control-Allow-Origin': '*' };
    if (cb) {
      if (!/^[A-Za-z_$][\w$.]{0,60}$/.test(cb)) fail(400, 'callback không hợp lệ');
      return ctx.raw(200, `/**/${cb}(${JSON.stringify(body)});`, { ...headers, 'Content-Type': 'text/javascript; charset=utf-8' });
    }
    return ctx.raw(200, JSON.stringify(body), { ...headers, 'Content-Type': 'application/json; charset=utf-8' });
  });

  let widgetCode = null;
  const widget = () => (widgetCode ??= readFileSync(join(PUBLIC, 'widget', 'embed.js'), 'utf8'));
  function siteConfig(ws, base) {
    const projects = db.prepare('SELECT id, name, page_url FROM projects WHERE workspace_id = ? AND is_public = 1 ORDER BY sort, id').all(ws.id);
    const links = {}, news = {};
    for (const p of projects) { if (p.page_url) links['P' + p.id] = p.page_url; news['P' + p.id] = [p.name]; }
    const cfg = {
      API_URL: `${base}/api/public/${ws.slug}`, brandName: ws.brand_name || ws.name, brandColor: ws.color,
      hotline: (ws.hotline || '').replace(/[^\d+]/g, ''), hotlineText: ws.hotline || '', zalo: ws.zalo || '',
      company: { name: ws.company_name || ws.name, address: ws.address, taxCode: ws.tax_code },
      projectOrder: projects.map((p) => 'P' + p.id), projectLinks: links, contentPages: {}, newsSearch: news, docs: {}, layouts: {}
    };
    // Tab thông tin dự án chỉ bật khi có ít nhất một dự án gắn trang WordPress.
    if (!Object.keys(links).length) cfg.tabs = [];
    return cfg;
  }
  r.get('/embed/:file', async (ctx) => {
    const m = /^([a-z0-9-]+)\.js$/.exec(ctx.params.file);
    const ws = m && wsBySlug(m[1]);
    if (!ws) return ctx.raw(404, '/* Không tìm thấy bảng hàng */', { 'Content-Type': 'text/javascript; charset=utf-8' });
    const js = `window.ADL_SITE=Object.assign(${JSON.stringify(siteConfig(ws, ctx.base))},window.ADL_SITE||{});\n${widget()}`;
    return ctx.raw(200, js, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' });
  });

  const PUBLIC_CSP = "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; " +
    "script-src 'self'; connect-src 'self' https:; frame-src https:; frame-ancestors *; base-uri 'self'";
  r.get('/b/:slug', async (ctx) => {
    const ws = wsBySlug(ctx.params.slug);
    if (!ws) return ctx.raw(404, page404(), { 'Content-Type': 'text/html; charset=utf-8' });
    const brand = ws.brand_name || ws.name, tel = (ws.hotline || '').replace(/[^\d+]/g, '');
    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bảng hàng ${esc(brand)}</title><meta name="description" content="Bảng giá tham khảo các dự án do ${esc(brand)} tư vấn.">
<link rel="stylesheet" href="/public.css"><link rel="icon" href="/favicon.svg"></head><body style="--brand:${esc(/^#[0-9a-f]{6}$/i.test(ws.color) ? ws.color : '#a31d24')}">
<header class="top"><div class="in">${ws.logo_url ? `<img class="logo-img" src="${esc(ws.logo_url)}" alt="${esc(brand)}">` : `<b class="logo">${esc(brand)}</b>`}<span class="sp"></span>
${ws.zalo ? `<a class="btn ghost" href="${esc(ws.zalo)}" target="_blank" rel="noopener">Nhắn Zalo</a>` : ''}${tel ? `<a class="btn" href="tel:${esc(tel)}">Gọi ${esc(ws.hotline)}</a>` : ''}</div></header>
<main><div data-adl-bang-hang></div></main>
<footer><div class="in"><div><b>${esc(ws.company_name || ws.name)}</b>${ws.address ? `<br>${esc(ws.address)}` : ''}${ws.tax_code ? `<br>Mã số thuế: ${esc(ws.tax_code)}` : ''}</div>
<div class="pw">Vận hành bởi <a href="/" target="_blank" rel="noopener">${esc(PRODUCT.name)}</a></div></div></footer>
<script src="/embed/${esc(ws.slug)}.js"></script></body></html>`;
    return ctx.html(html, { csp: PUBLIC_CSP, frame: true });
  });

  function page404() {
    return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Không tìm thấy</title><link rel="stylesheet" href="/public.css">
<main style="padding:80px 20px;text-align:center"><h1>Không tìm thấy trang</h1><p><a href="/">Về trang chủ ${esc(PRODUCT.name)}</a></p></main>`;
  }

  r.get('/healthz', async (ctx) => { db.prepare('SELECT 1').get(); return ctx.raw(200, 'ok', {}); });
  r.get('/api/plans', async () => ({ product: PRODUCT, plans: Object.entries(PLANS).filter(([, p]) => !p.hidden).map(([id, p]) => ({ id, ...p })), yearlyMonthsCharged: YEARLY_MONTHS_CHARGED, trialDays: PLANS.trial.days }));

  // ─── Xử lý yêu cầu ───
  async function handle(req, res) {
    const url = new URL(req.url, 'http://x');
    const path = url.pathname;
    const base = SETTINGS.baseUrl || `${req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'}://${req.headers.host}`;
    const ctx = {
      req, res, query: url.searchParams, ip: clientIp(req), base, body: {}, params: {},
      session: null,
      raw: (status, body, headers) => { send(res, status, body, headers); return undefined; },
      html: (html, o) => { sendHtml(res, html, o); return undefined; }
    };
    try {
      const m = r.match(req.method, path);
      if (m) {
        ctx.params = m.params;
        ctx.session = loadSession(db, parseCookies(req)[SID]);
        if (path.startsWith('/api/') && !['GET', 'HEAD'].includes(req.method)) {
          // Chống giả mạo yêu cầu từ trang khác (CSRF): bắt buộc tiêu đề riêng và cùng nguồn.
          if (req.headers['x-gh'] !== '1') fail(403, 'Yêu cầu không hợp lệ.');
          const origin = req.headers.origin;
          if (origin && new URL(origin).host !== req.headers.host) fail(403, 'Yêu cầu không hợp lệ.');
          ctx.body = await readBody(req);
        }
        const out = await m.handler(ctx);
        if (out !== undefined) send(res, 200, out);
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') fail(404, 'Không tìm thấy.');
      if (path === '/') { if (await serveStatic(res, PUBLIC, 'index.html')) return; }
      if (path === '/app' || path === '/app/') { const html = readFileSync(join(PUBLIC, 'app', 'index.html'), 'utf8'); return sendHtml(res, html); }
      if (await serveStatic(res, PUBLIC, path === '/' ? 'index.html' : path.endsWith('/') ? path + 'index.html' : path)) return;
      if (/^\/[a-z-]+$/.test(path) && await serveStatic(res, PUBLIC, path + '.html')) return;
      if (path.startsWith('/api/')) fail(404, 'Không tìm thấy.');
      send(res, 404, page404(), { 'Content-Type': 'text/html; charset=utf-8' });
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...(e.extra || {}) });
      console.error(new Date().toISOString(), req.method, path, e);
      send(res, 500, { error: 'Có lỗi xảy ra. Vui lòng thử lại.' });
    }
  }

  // Đồng bộ Google Sheet định kỳ cho các dự án có gắn link (gọi từ máy chủ).
  async function syncDue() {
    const mins = SETTINGS.sheetSyncMinutes;
    const due = db.prepare(`SELECT p.* FROM projects p WHERE p.sheet_url != '' AND (p.sheet_synced_at IS NULL OR p.sheet_synced_at < datetime('now', ?))`).all(`-${mins} minutes`);
    for (const p of due) {
      const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(p.workspace_id);
      if (!subscription(ws).active) continue;
      try { await syncSheet(p, ws, null); } catch { /* lỗi đã ghi vào sheet_error */ }
    }
    return due.length;
  }

  return { handle, expireHolds, syncDue };
}
