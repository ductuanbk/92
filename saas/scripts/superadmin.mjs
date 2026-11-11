// Cấp hoặc gỡ quyền quản trị hệ thống cho một tài khoản đã đăng ký.
// Cách dùng: npm run superadmin -- email@congty.vn        (cấp quyền)
//            npm run superadmin -- email@congty.vn --off  (gỡ quyền)
import { openDb } from '../src/db.js';
import { SETTINGS } from '../src/config.js';

const email = String(process.argv[2] || '').toLowerCase();
const off = process.argv.includes('--off');
if (!email) { console.error('Thiếu email. Ví dụ: npm run superadmin -- ban@congty.vn'); process.exit(1); }
const db = openDb(SETTINGS.dbFile);
const res = db.prepare('UPDATE users SET is_superadmin = ? WHERE email = ?').run(off ? 0 : 1, email);
console.log(res.changes ? `${off ? 'Đã gỡ' : 'Đã cấp'} quyền quản trị hệ thống cho ${email}.` : `Không tìm thấy tài khoản ${email}. Đăng ký trước rồi chạy lại.`);
