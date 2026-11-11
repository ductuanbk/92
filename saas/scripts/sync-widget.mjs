// Chép khối bảng hàng (docs/embed.js) vào phần mềm. Chạy lại mỗi khi sửa docs/embed.js: npm run sync-widget
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', 'docs', 'embed.js');
const dst = join(here, '..', 'public', 'widget', 'embed.js');
mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);
console.log('Đã chép', src, '→', dst);
