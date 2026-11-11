// Mật khẩu, phiên đăng nhập, mã mời và quyền theo vai trò.
import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { SETTINGS, PLANS, GRACE_DAYS } from './config.js';
import { fail } from './http.js';

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}
export function verifyPassword(pw, stored) {
  const [alg, s, h] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !s || !h) return false;
  const expected = Buffer.from(h, 'base64');
  const got = scryptSync(String(pw), Buffer.from(s, 'base64'), expected.length, { N: 16384, r: 8, p: 1 });
  return timingSafeEqual(expected, got);
}
export function checkPassword(pw) {
  if (String(pw || '').length < 8) fail(400, 'Mật khẩu cần ít nhất 8 ký tự.');
  if (String(pw).length > 200) fail(400, 'Mật khẩu quá dài.');
}

export const newToken = () => randomBytes(32).toString('base64url');
export const sha = (t) => createHash('sha256').update(String(t)).digest('hex');
const plusDays = (d) => new Date(Date.now() + d * 86400000).toISOString();

export function createSession(db, userId, workspaceId) {
  const token = newToken();
  db.prepare('INSERT INTO sessions (token_hash, user_id, workspace_id, expires_at) VALUES (?, ?, ?, ?)')
    .run(sha(token), userId, workspaceId ?? null, plusDays(SETTINGS.sessionDays));
  return token;
}

/** Đọc phiên từ cookie; trả về { user, workspace, role } hoặc null. */
export function loadSession(db, token) {
  if (!token) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(sha(token));
  if (!s || s.expires_at < new Date().toISOString()) return null;
  const user = db.prepare('SELECT id, email, name, phone, is_superadmin FROM users WHERE id = ?').get(s.user_id);
  if (!user) return null;
  let ws = null, role = null;
  if (s.workspace_id) {
    const m = db.prepare('SELECT role FROM memberships WHERE workspace_id = ? AND user_id = ?').get(s.workspace_id, user.id);
    if (m) { ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(s.workspace_id); role = m.role; }
  }
  if (!ws) {
    // Phiên chưa chọn đơn vị (hoặc đã bị gỡ khỏi đơn vị cũ): lấy đơn vị đầu tiên còn là thành viên.
    const m = db.prepare('SELECT workspace_id, role FROM memberships WHERE user_id = ? ORDER BY created_at LIMIT 1').get(user.id);
    if (m) {
      ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(m.workspace_id); role = m.role;
      db.prepare('UPDATE sessions SET workspace_id = ? WHERE token_hash = ?').run(ws.id, sha(token));
    }
  }
  return { user, workspace: ws, role, tokenHash: sha(token) };
}

export const ROLE_RANK = { sale: 1, admin: 2, owner: 3 };
export const ROLE_NAME = { owner: 'Chủ tài khoản', admin: 'Quản trị', sale: 'Nhân viên kinh doanh' };

/** Bắt buộc đăng nhập, có đơn vị và đủ quyền. */
export function need(ctx, role = 'sale') {
  if (!ctx.session) fail(401, 'Vui lòng đăng nhập.');
  if (!ctx.session.workspace) fail(403, 'Tài khoản chưa thuộc đơn vị nào.');
  if (ctx.session.workspace.status === 'suspended') fail(403, 'Tài khoản đơn vị đang tạm khóa. Vui lòng liên hệ hỗ trợ.');
  if (ROLE_RANK[ctx.session.role] < ROLE_RANK[role]) fail(403, 'Bạn không có quyền thực hiện thao tác này.');
  return ctx.session;
}

/** Thông tin gói hiện tại: còn hạn, hết dùng thử, giới hạn. */
export function subscription(ws) {
  const now = new Date().toISOString();
  const paidActive = ws.paid_until && ws.paid_until > now;
  const trialActive = ws.plan === 'trial' && ws.trial_ends_at && ws.trial_ends_at > now;
  const plan = PLANS[ws.plan] || PLANS.trial;
  const endsAt = ws.plan === 'trial' ? ws.trial_ends_at : ws.paid_until;
  const active = ws.status === 'active' && (paidActive || trialActive || ws.plan === 'business' && !ws.paid_until);
  const graceEnd = endsAt ? new Date(new Date(endsAt).getTime() + GRACE_DAYS * 86400000).toISOString() : null;
  return {
    plan: ws.plan, planName: plan.name, active, endsAt,
    publicActive: ws.status === 'active' && (active || (graceEnd && graceEnd > now)),
    limits: { projects: plan.projects, units: plan.units, members: plan.members }
  };
}

/** Chặn thao tác ghi khi gói đã hết hạn (vẫn cho xem dữ liệu). */
export function needActive(ws) {
  if (!subscription(ws).active) fail(402, 'Gói dịch vụ đã hết hạn. Vui lòng gia hạn trong mục Thanh toán để tiếp tục cập nhật.');
}
