"""Lay out one institution logo so it fills the map's circular badge.

Usage: python3 -I scripts/logo-layout.py SOURCE TARGET SIZE
Writes a SIZE x SIZE PNG and prints one line of JSON describing the result (mode, the logo's own
resolution in pixels, its width-to-height ratio and how much of the circle it fills), or exits non-zero
with a reason when the image is unusable (too small, blank, too pale to show on the white disc, or a plain
picture with almost no shapes, such as a favicon made of two colour blocks).

How the logo is found inside the image:
- free: a logo on a transparent background; the logo is the visible pixels;
- tile: a logo on a plain coloured square (an app icon, or a logo on white); the logo is what differs
  from the background colour, and the badge is filled with that colour so the square disappears;
- cover: a square picture with no plain background (a photo-like icon); it covers the whole disc.
The logo is then centred and scaled until almost all of it (99.5 % of its pixels, or all of it for a
wordmark) sits inside the circle, so round seals and shields fill the disc. A wide wordmark that starts
with a separate emblem (crest, shield, monogram) is reduced to that emblem.
"""
import json
import sys
import numpy as np
from PIL import Image

src, target, SIZE = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src)
if getattr(im, 'ico', None):
    im = im.ico.getimage(sorted(im.ico.sizes(), key=lambda s: s[0] * s[1])[-1])
im = im.convert('RGBA')
w, h = im.size
if min(w, h) < 24:
    raise SystemExit('too small')
px = np.asarray(im).astype(np.int16)
rgb, alpha = px[..., :3], px[..., 3]


def patch(x, y, r=2):
    p = px[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1].reshape(-1, 4)
    return p[:, :3].mean(0), p[:, 3].min()


def lum(c):
    return 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]


mode, bg = 'free', None
mask = alpha > 40
corners = [patch(2, 2), patch(w - 3, 2), patch(2, h - 3), patch(w - 3, h - 3)]
spread = lambda cs: max(np.abs(a - b).max() for a in cs for b in cs)
if min(a for _, a in corners) > 200:
    cols = [c for c, _ in corners]
    if spread(cols) < 40:
        mode, bg = 'tile', np.median(cols, axis=0)
    elif max(w, h) <= 1.15 * min(w, h):
        mode = 'cover'
    else:
        raise SystemExit('busy background')
else:
    # A tile with rounded (transparent) corners: its visible part fills its box; read the colour just inside.
    ys, xs = np.nonzero(mask)
    if len(xs):
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        if max(bw, bh) <= 1.15 * min(bw, bh) and mask[y0:y1 + 1, x0:x1 + 1].mean() > 0.85:
            ins = [patch(int(x0 + bw * .12), int(y0 + bh * .12)), patch(int(x1 - bw * .12), int(y0 + bh * .12)),
                   patch(int(x0 + bw * .12), int(y1 - bh * .12)), patch(int(x1 - bw * .12), int(y1 - bh * .12))]
            if min(a for _, a in ins) > 200 and spread([c for c, _ in ins]) < 40:
                mode, bg = 'tile', np.median([c for c, _ in ins], axis=0)
if mode == 'tile':
    mask = (np.abs(rgb - bg).max(-1) > 48) & (alpha > 128)
    if lum(bg) > 235:
        bg = np.array([255, 255, 255])  # a logo on white: the white disc is the background

if mode == 'cover':
    s = min(w, h)
    crop = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    out = crop.resize((SIZE, SIZE), Image.LANCZOS)
    native, aspect, fill = s, 1.0, 1.0
else:
    ys, xs = np.nonzero(mask)
    if len(xs) < 30:
        raise SystemExit('blank')
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    emblem = False
    if (x1 - x0) > 1.8 * (y1 - y0):
        # Columns with no logo pixels split a wordmark into parts; a leading part about as tall as the whole
        # and roughly square is the emblem.
        cols = mask[y0:y1, x0:x1].any(0)
        gap = max(2, int(0.015 * (x1 - x0)))
        segs, start, run = [], None, 0
        for i, c in enumerate(cols):
            if c:
                if start is None:
                    start = i
                run = 0
            elif start is not None:
                run += 1
                if run >= gap:
                    segs.append((start, i - run + 1)); start, run = None, 0
        if start is not None:
            segs.append((start, len(cols)))
        if len(segs) > 1:
            a, b = segs[0]
            sub = mask[y0:y1, x0 + a:x0 + b]
            sy = np.nonzero(sub.any(1))[0]
            eh = sy.max() - sy.min() + 1
            if eh >= 0.7 * (y1 - y0) and (b - a) <= 1.4 * eh and (b - a) >= 0.6 * eh:
                x0, x1, emblem = x0 + a, x0 + b, True
                y0, y1 = y0 + sy.min(), y0 + sy.max() + 1
    cw, ch = x1 - x0, y1 - y0
    sub = mask[y0:y1, x0:x1]
    content = rgb[y0:y1, x0:x1][sub]
    # A logo that would vanish on the white disc: almost nothing darker than pale grey.
    if (bg is None or lum(bg) > 235) and (lum(content) < 170).mean() < 0.03:
        raise SystemExit('too pale')
    if bg is not None and lum(bg) <= 235 and np.abs(content - bg).max(-1).mean() < 60:
        raise SystemExit('faint')
    aspect = max(cw, ch) / min(cw, ch)
    yy, xx = np.nonzero(sub)
    d = np.hypot(xx + 0.5 - cw / 2, yy + 0.5 - ch / 2)
    reach = np.percentile(d, 100 if aspect > 1.5 else 99.5) + 0.5
    R = SIZE / 2
    scale = 0.965 * R / reach
    piece = im.crop((x0, y0, x1, y1))
    if bg is not None:
        flat = Image.new('RGBA', piece.size, tuple(int(v) for v in bg) + (255,))
        flat.alpha_composite(piece)
        piece = flat
    nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
    piece = piece.resize((nw, nh), Image.LANCZOS)
    out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0) if bg is None else tuple(int(v) for v in bg) + (255,))
    out.paste(piece, ((SIZE - nw) // 2, (SIZE - nh) // 2), piece)
    native = max(cw, ch)
    # Share of the circle covered by the logo's box (a seal or a shield fills almost all of it, a wordmark little).
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    disc = np.hypot(xx + 0.5 - R, yy + 0.5 - R) <= R
    box = (np.abs(xx + 0.5 - R) <= nw / 2) & (np.abs(yy + 0.5 - R) <= nh / 2)
    fill = float((disc & box).sum() / disc.sum())
    mode += '+emblem' if emblem else ''
# A plain picture with almost no shapes (two flat colour blocks, a bare colour square) is not a logo.
flat = Image.new('RGBA', out.size, (255, 255, 255, 255))
flat.alpha_composite(out.convert('RGBA'))  # as it shows on the white disc
g = np.asarray(flat).astype(np.int16)
edge = (np.abs(np.diff(g[..., :3], axis=0)).max(-1)[:, :-1] > 60) | (np.abs(np.diff(g[..., :3], axis=1)).max(-1)[:-1, :] > 60)
yy, xx = np.mgrid[0:SIZE - 1, 0:SIZE - 1]
inside = np.hypot(xx + 1 - SIZE / 2, yy + 1 - SIZE / 2) < SIZE / 2 - 2
if (edge & inside).sum() < 0.01 * inside.sum():
    raise SystemExit('no detail')
out.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(target, optimize=True)
print(json.dumps({'mode': mode, 'native': int(native), 'aspect': round(float(aspect), 2), 'fill': round(fill, 2),
                  'bg': None if bg is None else [int(v) for v in bg]}))
