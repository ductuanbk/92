"""Tạo dữ liệu tab "Mặt bằng quỹ căn" từ file PDF tổng mặt bằng (bản xuất từ CAD, có lớp chữ mã căn).

Cách dùng:
    pip install pymupdf pillow
    python3 tools/map-from-pdf.py <file.pdf> <thư mục ra> [x0 y0 x1 y1]

x0 y0 x1 y1: vùng cắt, tính bằng point trên trang PDF đã xoay đúng chiều (mặc định là vùng Khu 1, Khu 2
của file 260918_TMB-Tien-ich_Khu-12-DA-VH-Sagon-Park-Update-2.pdf).

Kết quả:
    overview-s.jpg ảnh xem trước (rộng 720 px), hiện ngay khi mở tab
    overview.jpg   ảnh xem toàn cảnh (rộng 1800 px)
    t/<cột>_<hàng>.jpg   ô ảnh 512 px ở độ phân giải gốc, tải khi phóng to
    t2/, t4/       ô ảnh WebP nét gấp 2 và gấp 4 (bản vẽ CAD là véc-tơ nên đọc được mã căn, diện tích),
                   chỉ tạo cho vùng có lô đất
    map.json       kích thước ảnh gốc và toạ độ (pixel ảnh gốc) của từng mã căn đọc được trong PDF
"""
import json
import math
import os
import re
import statistics
import sys

import pymupdf
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
CODE = re.compile(r'^([A-ZĐ]{1,5}\d+[A-Z]?)-(\d+[A-Z]?)$')


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    pdf, out = sys.argv[1], sys.argv[2]
    x0, y0, x1, y1 = [float(v) for v in sys.argv[3:7]] if len(sys.argv) >= 7 else (780, 560, 2790, 2290)
    page = pymupdf.open(pdf)[0]
    rot = page.rotation_matrix
    # Độ phân giải của ảnh nền nhúng trong PDF (pixel trên mỗi point), để ô ảnh không bị phóng to giả.
    scale = 2.75
    imgs = page.get_images(full=True)
    if imgs:
        rect = page.get_image_rects(imgs[0][0])[0]
        scale = min(3.0, round(imgs[0][2] / max(rect.width, 1), 2)) or 2.75
    os.makedirs(os.path.join(out, 't'), exist_ok=True)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), clip=pymupdf.Rect(x0, y0, x1, y1))
    full = os.path.join(out, 'full.png')
    pix.save(full)
    w, h = pix.width, pix.height
    im = Image.open(full).convert('RGB')
    os.remove(full)
    tile = 512
    cols, rows = math.ceil(w / tile), math.ceil(h / tile)
    for ty in range(rows):
        for tx in range(cols):
            box = (tx * tile, ty * tile, min(w, tx * tile + tile), min(h, ty * tile + tile))
            im.crop(box).save(os.path.join(out, 't', '%d_%d.jpg' % (tx, ty)), quality=74, optimize=True, progressive=True)
    im.resize((1800, round(h * 1800 / w)), Image.LANCZOS).save(os.path.join(out, 'overview.jpg'), quality=78, optimize=True, progressive=True)
    im.resize((720, round(h * 720 / w)), Image.LANCZOS).save(os.path.join(out, 'overview-s.jpg'), quality=68, optimize=True, progressive=True)

    groups = {}
    for word in page.get_text('words'):
        m = CODE.match(word[4])
        if not m:
            continue
        c = pymupdf.Point((word[0] + word[2]) / 2, (word[1] + word[3]) / 2) * rot
        x, y = round((c.x - x0) * scale), round((c.y - y0) * scale)
        if 0 <= x < w and 0 <= y < h:
            groups.setdefault(m.group(1), {}).setdefault(m.group(2), (x, y))
    # Tầng nét hơn: chỉ những ô quanh lô đất (ảnh nền ngoài vùng lô không nét thêm được).
    pts = [p for g in groups.values() for p in g.values()]
    levels = []
    for k in (2, 4):
        span = tile / k
        have = set()
        for x, y in pts:
            for gx in range(int((x - 110) // span), int((x + 110) // span) + 1):
                for gy in range(int((y - 110) // span), int((y + 110) // span) + 1):
                    if 0 <= gx * span < w and 0 <= gy * span < h:
                        have.add((gx, gy))
        d = 't%d' % k
        os.makedirs(os.path.join(out, d), exist_ok=True)
        m = pymupdf.Matrix(scale * k, scale * k)
        for gx, gy in sorted(have):
            px0, py0 = gx * span, gy * span
            px1, py1 = min(w, px0 + span), min(h, py0 + span)
            r = pymupdf.Rect(x0 + px0 / scale, y0 + py0 / scale, x0 + px1 / scale, y0 + py1 / scale)
            pm = page.get_pixmap(matrix=m, clip=r, alpha=False)
            Image.frombytes('RGB', (pm.width, pm.height), pm.samples).save(os.path.join(out, d, '%d_%d.webp' % (gx, gy)), 'WEBP', quality=70, method=4)
        levels.append({'d': d, 'k': k, 'have': ';'.join('%d_%d' % t for t in sorted(have))})
        print('tầng x%d: %d ô' % (k, len(have)))
    # Mỗi dãy: góc chữ mã căn (độ, theo hướng lô) và bề ngang lô (pixel ảnh gốc), để bảng hàng vẽ mã căn cỡ lớn khi phóng.
    ang, one = {}, {}
    for b in page.get_text('rawdict')['blocks']:
        for ln in b.get('lines', []):
            t = ''.join(c['c'] for s in ln['spans'] for c in s['chars']).strip()
            mm = CODE.match(t)
            if mm:
                v = pymupdf.Point(*ln['dir']) * pymupdf.Matrix(rot.a, rot.b, rot.c, rot.d, 0, 0)
                a = math.degrees(math.atan2(v.y, v.x))
                ang.setdefault(mm.group(1), []).append(a)
                one.setdefault((mm.group(1), mm.group(2)), a)
    rowinfo = {}
    for row, g in groups.items():
        P = list(g.values())
        nn = [min((math.hypot(x - a, y - b) for k, (a, b) in enumerate(P) if k != i), default=0) for i, (x, y) in enumerate(P)]
        rowinfo[row] = [round(statistics.median(ang.get(row, [0]))), round(statistics.median(nn), 1)]
    # Dãy cong (góc chữ khác nhau giữa các lô): ghi thêm góc riêng của từng căn, dạng số:x,y,góc.
    def entry(row, n, x, y):
        a = [one.get((row, k)) for k in groups[row]]
        a = [v for v in a if v is not None]
        bent = len(a) > 1 and max(a) - min(a) > 4
        return '%s:%d,%d' % (n, x, y) + (',%d' % round(one[(row, n)]) if bent and (row, n) in one else '')
    pos = {k: ';'.join(entry(k, n, x, y) for n, (x, y) in sorted(v.items())) for k, v in sorted(groups.items())}
    with open(os.path.join(out, 'map.json'), 'w', encoding='utf-8') as f:
        json.dump({'w': w, 'h': h, 'tile': tile, 'cols': cols, 'rows': rows, 'levels': levels, 'rowinfo': rowinfo, 'pos': pos}, f, ensure_ascii=False, separators=(',', ':'))
    print('ảnh %dx%d, %d ô, %d mã căn' % (w, h, cols * rows, sum(len(v) for v in groups.values())))


if __name__ == '__main__':
    main()
