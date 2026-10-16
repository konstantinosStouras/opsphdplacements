"""Render typographic website assets. Requires Pillow; generated assets are committed.

Uses Georgia from Windows where available, otherwise DejaVu Serif. Font files are
never distributed. No research counts/dates are baked into the share image.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
PAPER, INK, GREEN, MUTED, RULE = "#fcfbf8", "#252b2a", "#346759", "#66716d", "#d6dad3"


def font(size, italic=False):
    candidates = [
        Path("C:/Windows/Fonts") / ("georgiai.ttf" if italic else "georgia.ttf"),
        Path("/usr/share/fonts/truetype/dejavu") / ("DejaVuSerif-Italic.ttf" if italic else "DejaVuSerif.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    raise RuntimeError("Install Georgia or DejaVu Serif before regenerating brand assets.")


def icon(size):
    canvas = Image.new("RGB", (size, size), GREEN)
    draw = ImageDraw.Draw(canvas)
    face = font(round(size * .67))
    box = draw.textbbox((0, 0), "O", font=face)
    draw.text(((size - box[2] + box[0]) / 2 - box[0],
               (size - box[3] + box[1]) / 2 - box[1]), "O", font=face, fill=PAPER)
    return canvas


card = Image.new("RGB", (1200, 630), PAPER)
draw = ImageDraw.Draw(card)
draw.rectangle((0, 0, 1199, 9), fill=GREEN)
draw.line((72, 159, 1128, 159), fill=RULE, width=2)
card.paste(icon(64), (72, 65))
draw.text((158, 79), "OPERATIONS PHD PLACEMENTS", font=font(28), fill=GREEN)
draw.text((72, 201), "Where do Operations", font=font(67), fill=INK)
draw.text((72, 279), "PhDs land?", font=font(83), fill=INK)
draw.text((75, 397), "Tracing doctoral careers in academia and industry", font=font(29, True), fill=MUTED)
draw.line((72, 469, 1128, 469), fill=RULE, width=2)
draw.text((75, 493), "Operations Research  /  Operations Management  /  Industrial Engineering", font=font(23), fill=INK)
draw.text((75, 551), "stouras.com/opsphdplacements", font=font(22), fill=GREEN)
author = "Konstantinos Stouras"
draw.text((1128 - draw.textlength(author, font=font(22)), 551), author, font=font(22), fill=MUTED)
card.save(ASSETS / "social-preview-v1.png", optimize=True)

large = icon(512)
for size, name in [(32, "favicon-32.png"), (48, "favicon-48.png"),
                   (180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
    large.resize((size, size), Image.Resampling.LANCZOS).save(ASSETS / name, optimize=True)
large.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("Generated share image, favicon sizes and mobile icons.")
