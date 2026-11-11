// Sao lưu cơ sở dữ liệu khi máy chủ đang chạy (an toàn, không cần dừng). Giữ lại 30 bản gần nhất.
// Cách dùng: npm run backup   (đặt lịch chạy mỗi ngày bằng cron, xem README)
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { SETTINGS } from '../src/config.js';

const dir = process.env.BACKUP_DIR || join(dirname(SETTINGS.dbFile), 'backups');
const keep = Number(process.env.BACKUP_KEEP || 30);
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const file = join(dir, `gio-hang-${stamp}.db`);
const db = new DatabaseSync(SETTINGS.dbFile, { readOnly: true });
db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
db.close();
const old = readdirSync(dir).filter((f) => /^gio-hang-.*\.db$/.test(f)).sort().slice(0, -keep);
for (const f of old) rmSync(join(dir, f));
console.log('Đã sao lưu:', file, old.length ? `(xóa ${old.length} bản cũ)` : '');
