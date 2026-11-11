// Lớp HTTP tối giản: định tuyến, đọc JSON, cookie, tệp tĩnh, tiêu đề bảo mật. Không dùng thư viện ngoài.
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { SETTINGS } from './config.js';

export class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}
export const fail = (status, message, extra) => { throw new HttpError(status, message, extra); };

export function router() {
  const routes = [];
  const add = (method, pattern, handler) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ method, re, keys, handler });
  };
  return {
    get: (p, h) => add('GET', p, h), post: (p, h) => add('POST', p, h),
    put: (p, h) => add('PUT', p, h), del: (p, h) => add('DELETE', p, h),
    match(method, path) {
      for (const r of routes) {
        if (r.method !== method && !(method === 'HEAD' && r.method === 'GET')) continue;
        const m = r.re.exec(path);
        if (m) return { handler: r.handler, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
      }
      return null;
    }
  };
}

export function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(name, value, { maxAge, httpOnly = true } = {}) {
  return [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax', httpOnly && 'HttpOnly',
    SETTINGS.secureCookies && 'Secure', maxAge !== undefined && `Max-Age=${maxAge}`].filter(Boolean).join('; ');
}

export async function readBody(req) {
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > SETTINGS.maxBodyBytes) fail(413, 'Dữ liệu gửi lên quá lớn (tối đa 5 MB).');
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { fail(400, 'Dữ liệu không đúng định dạng.'); }
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
const APP_CSP = "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

export function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  const payload = isBuf || typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': isBuf || typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(res.req && res.req.method === 'HEAD' ? undefined : payload);
}

export function sendHtml(res, html, { csp = APP_CSP, frame = false, cache = 'no-cache' } = {}) {
  send(res, 200, html, {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache,
    'Content-Security-Policy': frame ? csp.replace("frame-ancestors 'none'", 'frame-ancestors *') : csp,
    ...(frame ? {} : { 'X-Frame-Options': 'DENY' })
  });
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };

/** Phục vụ tệp tĩnh trong thư mục public, chặn đường dẫn thoát ra ngoài. */
export async function serveStatic(res, root, urlPath) {
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
  const file = join(root, rel);
  if (!file.startsWith(root + sep) && file !== root) return false;
  try {
    const st = await stat(file);
    if (!st.isFile()) return false;
    const body = await readFile(file);
    const ext = extname(file);
    send(res, 200, body, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300',
      ...(ext === '.js' ? { 'Access-Control-Allow-Origin': '*' } : {})
    });
    return true;
  } catch { return false; }
}

/** Giới hạn số lần thử (đăng nhập, đăng ký) theo khóa trong một khoảng thời gian. */
export function rateLimiter(max, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now(), list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    list.push(now); hits.set(key, list);
    if (hits.size > 10000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    if (list.length > max) fail(429, 'Bạn thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.');
  };
}

export function clientIp(req) {
  // Sau proxy (Nginx, Cloudflare) dùng IP do proxy chuyển tiếp.
  const xf = String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || req.socket.remoteAddress || '';
}
