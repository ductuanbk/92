// Đọc bảng giỏ hàng từ Excel (dán), CSV, Google Sheet: tự tìm dòng tiêu đề, khớp cột theo tên.
import { STATUS } from './config.js';

export function norm(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Tên cột trong file → trường dữ liệu. So khớp không dấu, không phân biệt hoa thường.
export const FIELD_ALIASES = {
  code: ['ma can moi', 'ma can', 'ma can tm', 'ma san pham', 'ma lo', 'can', 'unit', 'code'],
  zone: ['khu', 'phan khu', 'zone'],
  street: ['duong', 'day / quy', 'day', 'toa', 'block'],
  type: ['loai can', 'loai hinh', 'san pham', 'type'],
  handover: ['tcbg moi', 'tcbg', 'tieu chuan ban giao', 'ban giao'],
  partner: ['doi tac'],
  direction: ['huong', 'huong cua', 'huong chinh'],
  land: ['dt dat', 'dt dat (m2)', 'dt dat (m²)', 'dien tich dat', 'dien tich'],
  build: ['dtxd', 'dtxd (m2)', 'dtxd (m²)', 'dien tich xay dung', 'dt xay dung'],
  priceExVat: ['gia chua gom vat', 'gia chua vat', 'gia truoc vat'],
  price: ['gia gom vat va kpbt', 'gia gom vat + kpbt', 'gia niem yet', 'tong gia', 'gia ban', 'gia'],
  priceLoan: ['gia vay 18t', 'gia vay'],
  priceEarly: ['gia tts', 'gia thanh toan som'],
  priceProgress: ['gia tttd', 'gia thanh toan tien do'],
  fund: ['quy can', 'so cap / thu cap'],
  status: ['tinh trang', 'trang thai', 'status'],
  note: ['ghi chu', 'noted', 'ghi chu / gio bank'],
  ptg: ['link ptg', 'ptg + chi can', 'ptg', 'phieu tinh gia'],
  unitLink: ['chi can', 'link chi can', 'anh chi can'],
  exclusive: ['doc quyen', 'gio dq']
};
// Các trường khớp theo phần đầu tiêu đề (ví dụ "Giá TTS (gồm VAT)").
const PREFIX_FIELDS = ['priceEarly', 'priceProgress', 'fund', 'priceLoan', 'land', 'build'];
export const MONEY_FIELDS = ['price', 'priceExVat', 'priceLoan', 'priceEarly', 'priceProgress'];
export const AREA_FIELDS = ['land', 'build'];

export function canonStatus(raw) {
  const n = norm(raw);
  if (!n) return '';
  if (/\b(da ban|sold|het hang|da ky|ky hdmb)\b/.test(n)) return STATUS.SOLD;
  if (/\b(da coc|dat coc|coc)\b/.test(n)) return STATUS.DEPOSITED;
  if (/\b(lock|locked|giu cho|dang giu|da giu|book|booking|booked)\b/.test(n)) return STATUS.LOCKED;
  if (/\b(check|lien he)\b/.test(n)) return STATUS.CHECK;
  if (/^(con hang|con|ton|trong|con trong|available|mo ban|dang ban|san|san hang)\b/.test(n)) return STATUS.AVAILABLE;
  return '';
}

/** Đọc số: tiền ("41.278.010.218", "20,873,934,525", "5,6 tỷ") hoặc diện tích ("266,9", "131.5"). */
export function toNumber(v, kind) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = String(v == null ? '' : v).trim();
  if (!s || s === '-') return null;
  if (kind === 'money') {
    const ty = /t[ỷy]/i.test(s), tr = /tri[ệe]u|tr\b/i.test(s);
    if (ty || tr) {
      const n = toNumber(s.replace(/[^\d.,]/g, ''), 'area');
      return n == null ? null : Math.round(n * (ty ? 1e9 : 1e6));
    }
    const digits = s.replace(/[^\d]/g, '');
    return digits ? Number(digits) : null;
  }
  s = s.replace(/\s/g, '').replace(/m2|m²/gi, '');
  const dots = (s.match(/\./g) || []).length, commas = (s.match(/,/g) || []).length;
  if (commas === 1 && dots === 0) s = s.replace(',', '.');
  else if (dots > 1 || (dots === 1 && commas === 1 && s.indexOf('.') < s.indexOf(','))) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

/** Tách CSV hoặc bảng dán từ Excel (phân cách bằng tab). Hỗ trợ ô có ngoặc kép, xuống dòng trong ô. */
export function parseTable(text) {
  text = String(text || '').replace(/^﻿/, '');
  // Đoán ký tự phân cách từ 20 dòng đầu (dòng đầu thường là tiêu đề bảng, không có phân cách).
  const head = text.split(/\r?\n/, 20).join('\n');
  const count = (ch) => (head.match(new RegExp(ch, 'g')) || []).length;
  const sep = count('\t') ? '\t' : count(';') > count(',') ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"' && cell === '') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

function mapColumns(header) {
  const h = header.map(norm), map = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const a of aliases) { const i = h.indexOf(a); if (i >= 0 && !Object.values(map).includes(i)) { map[field] = i; break; } }
  }
  for (const field of PREFIX_FIELDS) {
    if (map[field] !== undefined) continue;
    for (const a of FIELD_ALIASES[field]) {
      const i = h.findIndex((x, idx) => x.startsWith(a) && !Object.values(map).includes(idx));
      if (i >= 0) { map[field] = i; break; }
    }
  }
  return map;
}

/**
 * Chuyển bảng thô thành danh sách căn.
 * Trả về { units, columns (trường → tên cột), headerRow, skipped, warnings }.
 */
export function rowsToUnits(rows) {
  let hi = -1;
  for (let r = 0; r < Math.min(rows.length, 25) && hi < 0; r++) {
    if (rows[r].some((c) => FIELD_ALIASES.code.slice(0, 5).includes(norm(c)))) hi = r;
  }
  if (hi < 0) return { units: [], columns: {}, headerRow: -1, skipped: 0, warnings: ['Không tìm thấy dòng tiêu đề có cột "Mã căn".'] };
  const header = rows[hi], map = mapColumns(header), units = [], seen = new Set(), warnings = [];
  let skipped = 0, group = '';
  for (let r = hi + 1; r < rows.length; r++) {
    const row = rows[r], get = (f) => (map[f] === undefined ? '' : String(row[map[f]] ?? '').trim());
    const code = get('code');
    const filled = row.filter((c) => String(c).trim()).length;
    if (!code) {
      // Dòng nhóm, ví dụ "PHÂN KHU THÔ": dùng làm phân khu cho các dòng dưới nếu thiếu cột Khu.
      if (filled === 1) group = String(row.find((c) => String(c).trim())).trim();
      else if (filled) skipped++;
      continue;
    }
    if (norm(code) === norm(header[map.code])) continue;
    const key = norm(code).replace(/\s/g, '');
    if (seen.has(key)) { warnings.push(`Mã ${code} lặp lại, chỉ lấy dòng đầu.`); continue; }
    seen.add(key);
    const u = { code };
    for (const f of ['zone', 'street', 'type', 'handover', 'direction', 'partner', 'fund', 'note', 'ptg', 'unitLink']) u[f] = get(f);
    if (!u.zone && group && map.zone === undefined) u.zone = group;
    if (!u.street) { const m = /^([^-]+)-/.exec(code); u.street = m ? m[1] : ''; }
    for (const f of MONEY_FIELDS) u[f] = toNumber(get(f), 'money');
    for (const f of AREA_FIELDS) u[f] = toNumber(get(f), 'area');
    const st = get('status');
    u.status = canonStatus(st) || (st ? STATUS.CHECK : STATUS.AVAILABLE);
    u.exclusive = /^(1|x|co|yes|true|dq|doc quyen)$/.test(norm(get('exclusive'))) ? 1 : 0;
    for (const f of ['ptg', 'unitLink']) if (u[f] && !/^https?:\/\//i.test(u[f])) u[f] = '';
    units.push(u);
  }
  const columns = {};
  for (const [f, i] of Object.entries(map)) columns[f] = String(header[i]).trim();
  return { units, columns, headerRow: hi, skipped, warnings };
}

/** Link Google Sheet (chia sẻ "bất kỳ ai có link") → link tải CSV của đúng tab. */
export function sheetCsvUrl(link) {
  let u;
  try { u = new URL(String(link || '').trim()); } catch { return ''; }
  if (u.protocol !== 'https:' || u.hostname !== 'docs.google.com') return '';
  const m = /\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/.exec(u.pathname);
  if (!m) return '';
  const gid = (/[#&?]gid=(\d+)/.exec(u.href) || [])[1] || '0';
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
}
