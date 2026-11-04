// Tạo wordpress/bang-hang-cong-khai.html: đoạn mã tự chứa (không tải file ngoài) từ docs/embed.js.
// Chạy: npm i terser (một lần) rồi node tools/build-wordpress.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { minify } from 'terser';

const src = readFileSync(new URL('../docs/embed.js', import.meta.url), 'utf8');
const { code } = await minify(src, { compress: true, mangle: true, format: { comments: false, ascii_only: false } });
// Chặn chuỗi có thể làm trình duyệt hoặc WordPress cắt sai thẻ script.
const safe = code.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
if (/\n/.test(safe)) throw new Error('Mã nén còn xuống dòng');
// Thuộc tính trên thẻ script báo cho plugin tối ưu không trì hoãn/gộp mã:
// Cloudflare Rocket Loader (data-cfasync), LiteSpeed Cache (data-no-optimize, data-no-defer),
// WP Rocket (nowprocket), Autoptimize/SG Optimizer (data-no-minify, data-noptimize).
// Dòng chữ trong thẻ div hiện khi mã CHƯA chạy (bị chặn/trì hoãn); mã chạy sẽ tự che dòng này.
const html = `<!-- BẢNG HÀNG CÔNG KHAI Á ĐÔNG LAND – dán toàn bộ vào phần tử HTML của Flatsome (Add Elements › Content › HTML) hoặc khối "HTML tùy chỉnh". Không sửa dòng script. Tùy chọn: thêm data-du-an="VHSGP" hoặc data-du-an="VHCG" vào thẻ div để chỉ hiện một dự án. Tạo ngày ${new Date().toISOString().slice(0, 10)}. -->
<div data-adl-bang-hang><p style="padding:24px;border:1px dashed #d9dee7;border-radius:10px;text-align:center;color:#6b7385">Đang tải bảng hàng... Nếu dòng này không mất sau vài giây, mã bảng hàng đang bị chặn hoặc trì hoãn trên website. Vui lòng gọi 0933 772 422 để nhận giỏ hàng.</p></div>
<script data-cfasync="false" data-no-optimize="1" data-no-defer="1" data-no-minify="1" data-noptimize="1" nowprocket>${safe}</script>
`;
writeFileSync(new URL('../wordpress/bang-hang-cong-khai.html', import.meta.url), html);
console.log('OK', (html.length / 1024).toFixed(1) + ' KB');
