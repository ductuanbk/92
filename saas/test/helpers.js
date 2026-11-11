// Khởi động ứng dụng với CSDL trong bộ nhớ và một trình duyệt giả có giữ cookie.
import { createServer } from 'node:http';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';

export async function startApp(opts = {}) {
  const db = openDb(':memory:');
  const app = createApp(db, { signupLimit: 1000, loginLimit: 1000, ...opts });
  const server = createServer((req, res) => app.handle(req, res));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { db, app, base, close: () => new Promise((r) => server.close(r)) };
}

export function client(base) {
  let jar = '';
  async function call(method, path, body, headers = {}) {
    const res = await fetch(base + path, {
      method, redirect: 'manual',
      headers: { 'content-type': 'application/json', 'x-gh': '1', ...(jar ? { cookie: jar } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const set = res.headers.get('set-cookie');
    if (set) { const v = set.split(';')[0]; jar = v.endsWith('=') ? '' : v; }
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, headers: res.headers };
  }
  return {
    get: (p, h) => call('GET', p, undefined, h), post: (p, b, h) => call('POST', p, b ?? {}, h),
    put: (p, b) => call('PUT', p, b ?? {}), del: (p, b) => call('DELETE', p, b ?? {}),
    get cookie() { return jar; }
  };
}

let n = 0;
export async function signup(base, extra = {}) {
  const c = client(base);
  n++;
  const body = { company: `Sàn Test ${n}`, name: `Chủ ${n}`, email: `owner${n}@test.vn`, phone: '0901000' + String(n).padStart(3, '0'), password: 'matkhau123', agree: true, ...extra };
  const r = await c.post('/api/auth/signup', body);
  if (r.status !== 200) throw new Error('signup failed ' + JSON.stringify(r.data));
  return { c, email: body.email, password: body.password };
}

export const SAMPLE = [
  'GIỎ HÀNG ĐỘC QUYỀN',
  'STT\tMã căn\tLoại căn\tTCBG\tHướng\tDT đất\tDTXD\tGiá gồm VAT và KPBT\tGiá vay 18T\tTình trạng\tGhi chú\tLink PTG',
  'PHÂN KHU THÔ',
  '1\tAS47-16\tLiền kề\tThô\tĐông Bắc\t80\t150,4\t10.203.235.501\t10,466,428,445\tCòn trống\tQuỹ CĐT\thttps://drive.google.com/file/d/abc/view',
  '2\tAS48-34\tLiền kề góc\tGiãn xây\t\t96,5\t180\t8,15 tỷ\t\tĐã bán\t\t',
  '3\tSL2-01\tSong lập\tThô\tTây\t200\t300\t31500000000\t\tĐang lock\t\tkhông phải link'
].join('\n');
