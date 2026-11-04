// Tạo wordpress/bang-hang-cong-khai.html: đoạn mã tự chứa (không tải file ngoài) từ docs/embed.js.
// Chạy: npm i terser (một lần) rồi node tools/build-wordpress.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { minify } from 'terser';

const src = readFileSync(new URL('../docs/embed.js', import.meta.url), 'utf8');
const { code } = await minify(src, { compress: true, mangle: true, format: { comments: false, ascii_only: false } });
// Chặn chuỗi có thể làm trình duyệt hoặc WordPress cắt sai thẻ script.
const safe = code.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
if (/\n/.test(safe)) throw new Error('Mã nén còn xuống dòng');
const html = `<!-- BẢNG HÀNG CÔNG KHAI Á ĐÔNG LAND – dán toàn bộ vào phần tử HTML của Flatsome (Add Elements › Content › HTML) hoặc khối "HTML tùy chỉnh". Không sửa dòng script. Tùy chọn: thêm data-du-an="VHSGP" hoặc data-du-an="VHCG" vào thẻ div để chỉ hiện một dự án. Tạo ngày ${new Date().toISOString().slice(0, 10)}. -->
<div data-adl-bang-hang></div>
<script>${safe}</script>
`;
writeFileSync(new URL('../wordpress/bang-hang-cong-khai.html', import.meta.url), html);
console.log('OK', (html.length / 1024).toFixed(1) + ' KB');
