"""Lay out one institution icon for the map's circular badge.

Usage: python3 -I scripts/logo-layout.py SOURCE TARGET strict|lenient SIZE MIN
Prints the icon's own resolution (pixels) so the caller can choose the sharpest source; exits non-zero
when the image is unusable (too small, blank, too pale for a white disc, or too wide).

Two layouts, so every icon fills its circle:
- a full-bleed icon (square, opaque to the corners, like an app icon) covers the whole disc;
- an icon on a transparent background is centred and scaled until its farthest visible pixel sits just
  inside the circle, so nothing is clipped and round seals fill the disc.
"""
import math
import sys
from PIL import Image

src, target, mode, SIZE, MIN = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
im = Image.open(src)
if getattr(im, 'ico', None):
    im = im.ico.getimage(sorted(im.ico.sizes(), key=lambda s: s[0] * s[1])[-1])
im = im.convert('RGBA')
w, h = im.size
if w < MIN or h < MIN:
    raise SystemExit('too small')


def too_pale(img):
    # The disc behind the icon is white: an icon with almost no pixel darker than pale grey would vanish.
    lum, alpha = img.convert('L').getdata(), img.getchannel('A').getdata()
    solid = [l for l, a in zip(lum, alpha) if a > 128]
    return not solid or sum(1 for l in solid if l < 170) < 0.03 * len(solid)


alpha = im.getchannel('A')
corners = [alpha.getpixel((x, y)) for x, y in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))]
if max(w, h) <= 1.15 * min(w, h) and min(corners) > 200:
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    colours = im.convert('RGB').getcolors(1 << 16)
    if colours is not None and len(colours) < 2:
        raise SystemExit('blank')
    if too_pale(im):
        raise SystemExit('too pale')
    native = s
    out = im.resize((SIZE, SIZE), Image.LANCZOS)
else:
    box = alpha.point(lambda a: 255 if a > 16 else 0).getbbox()
    if not box:
        raise SystemExit('empty')
    im = im.crop(box)
    w, h = im.size
    if w < MIN * 0.75 and h < MIN * 0.75:
        raise SystemExit('too small after crop')
    if max(w, h) > (2.4 if mode == 'strict' else 3.0) * min(w, h):
        raise SystemExit('wide')
    colours = im.convert('RGB').getcolors(1 << 16)
    if colours is not None and len(colours) < 2:
        raise SystemExit('blank')
    if too_pale(im):
        raise SystemExit('too pale')
    # Farthest visible pixel from the centre decides the scale, with a 4 % margin inside the circle.
    cx, cy, a = (w - 1) / 2, (h - 1) / 2, im.getchannel('A').load()
    reach = max((math.hypot(x - cx, y - cy) for y in range(h) for x in range(w) if a[x, y] > 16), default=1) + 0.5
    scale = 0.46 * SIZE / reach
    native = max(w, h)
    im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    out.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2), im)
out.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(target, optimize=True)
print(native)
