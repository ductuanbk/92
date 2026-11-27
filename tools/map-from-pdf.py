"""Tạo dữ liệu tab "Mặt bằng quỹ căn" từ file PDF tổng mặt bằng (bản xuất từ CAD, có lớp chữ mã căn).

Cách dùng:
    pip install pymupdf pillow
    python3 tools/map-from-pdf.py <file.pdf> <thư mục ra> [x0 y0 x1 y1]

x0 y0 x1 y1: vùng cắt, tính bằng point trên trang PDF đã xoay đúng chiều (mặc định là vùng Khu 1, Khu 2
của file 260918_TMB-Tien-ich_Khu-12-DA-VH-Sagon-Park-Update-2.pdf).

Kết quả:
    overview.jpg   ảnh xem toàn cảnh (rộng 1800 px)
    t/<cột>_<hàng>.jpg   ô ảnh 512 px ở độ phân giải gốc, tải khi phóng to
    map.json       kích thước ảnh gốc và toạ độ (pixel ảnh gốc) của từng mã căn đọc được trong PDF
"""
import json
import math
import os
import re
import sys

import pymupdf
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
CODE = re.compile(r'^((?:TL|ĐLCV|AS|[A-Z]{1,4})\d+[A-Z]?)-(\d+[A-Z]?)$')


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

    groups = {}
    for word in page.get_text('words'):
        m = CODE.match(word[4])
        if not m:
            continue
        c = pymupdf.Point((word[0] + word[2]) / 2, (word[1] + word[3]) / 2) * rot
        x, y = round((c.x - x0) * scale), round((c.y - y0) * scale)
        if 0 <= x < w and 0 <= y < h:
            groups.setdefault(m.group(1), {}).setdefault(m.group(2), (x, y))
    pos = {k: ';'.join('%s:%d,%d' % (n, x, y) for n, (x, y) in sorted(v.items())) for k, v in sorted(groups.items())}
    with open(os.path.join(out, 'map.json'), 'w', encoding='utf-8') as f:
        json.dump({'w': w, 'h': h, 'tile': tile, 'cols': cols, 'rows': rows, 'pos': pos}, f, ensure_ascii=False, separators=(',', ':'))
    print('ảnh %dx%d, %d ô, %d mã căn' % (w, h, cols * rows, sum(len(v) for v in groups.values())))


if __name__ == '__main__':
    main()
