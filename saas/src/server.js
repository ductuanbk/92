// Khởi động máy chủ: node src/server.js (hoặc npm start).
import { createServer } from 'node:http';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { SETTINGS, PRODUCT } from './config.js';

const db = openDb(SETTINGS.dbFile);
const app = createApp(db);
const server = createServer((req, res) => { app.handle(req, res); });
server.requestTimeout = 60000;
server.headersTimeout = 20000;

server.listen(SETTINGS.port, () => {
  console.log(`${PRODUCT.name} đang chạy tại http://localhost:${SETTINGS.port} (dữ liệu: ${SETTINGS.dbFile})`);
  if (!SETTINGS.baseUrl) console.log('Lưu ý: chưa đặt BASE_URL, link mời và mã nhúng sẽ dùng địa chỉ trình duyệt đang mở.');
  if (!SETTINGS.superadmins.length) console.log('Lưu ý: chưa đặt SUPERADMIN_EMAILS, chưa ai duyệt được thanh toán.');
});

// Việc chạy nền: trả căn hết hạn giữ (mỗi phút), đồng bộ Google Sheet (mỗi phút kiểm tra dự án đến hạn).
let busy = false;
setInterval(async () => {
  if (busy) return; busy = true;
  try { app.expireHolds(); await app.syncDue(); } catch (e) { console.error('Việc nền lỗi:', e); } finally { busy = false; }
}, 60000).unref();

const stop = () => { server.close(() => { db.close(); process.exit(0); }); setTimeout(() => process.exit(0), 5000).unref(); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
