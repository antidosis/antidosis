"""Generate Antidosis-branded store graphics for the Wio Tracker L1 Pro.

Turns the supplier photos in public/images/store into a five-card branded
gallery (Play-Store-listing style): epic gradient backgrounds, the Antidosis
logo, spec chips and captions, with supplier branding removed.

Re-run any time:  python scripts/generate-store-graphics.py
"""

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

STORE = Path("public/images/store")
FONTS = Path("C:/Windows/Fonts")
SIZE = 1200

# Site palette (globals.css) + logo green
VOID = (10, 8, 6)
GOLD = (232, 213, 163)
SUN = (245, 166, 35)
MERCURY = (0, 229, 255)
ASH = (158, 146, 130)
GREEN = (61, 232, 108)


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


# ---------- building blocks ----------

def gradient(stops: list[tuple[float, tuple[int, int, int]]], angle_deg: float = 35) -> Image.Image:
    """Multi-stop linear gradient, computed small then upscaled smooth."""
    n = 140
    small = Image.new("RGB", (n, n))
    rad = math.radians(angle_deg)
    dx, dy = math.cos(rad), math.sin(rad)
    px = small.load()
    for y in range(n):
        for x in range(n):
            t = ((x * dx + y * dy) / (n * (abs(dx) + abs(dy)) - (abs(dx) + abs(dy))))
            t = max(0.0, min(1.0, t))
            for i in range(len(stops) - 1):
                p0, c0 = stops[i]
                p1, c1 = stops[i + 1]
                if p0 <= t <= p1:
                    f = (t - p0) / max(p1 - p0, 1e-6)
                    px[x, y] = tuple(int(c0[k] + (c1[k] - c0[k]) * f) for k in range(3))
                    break
            else:
                px[x, y] = stops[-1][1]
    return small.resize((SIZE, SIZE), Image.BICUBIC)


def glow(card: Image.Image, box: tuple[int, int, int, int], color: tuple[int, int, int], strength: int, blur: int = 150) -> Image.Image:
    mask = Image.new("L", card.size, 0)
    ImageDraw.Draw(mask).ellipse(box, fill=strength)
    mask = mask.filter(ImageFilter.GaussianBlur(blur))
    base = card.convert("RGB")
    base.paste(Image.new("RGB", card.size, color), (0, 0), mask)
    return base.convert("RGBA")


def mesh_field(card: Image.Image, seed: int = 7, alpha_line: int = 26, alpha_node: int = 80) -> Image.Image:
    rng = random.Random(seed)
    overlay = Image.new("RGBA", card.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    nodes = [(rng.randint(40, SIZE - 40), rng.randint(40, SIZE - 40)) for _ in range(30)]
    for i, (x1, y1) in enumerate(nodes):
        dists = sorted((math.hypot(x1 - x2, y1 - y2), j) for j, (x2, y2) in enumerate(nodes) if j != i)
        for _, j in dists[:2]:
            d.line([(x1, y1), (nodes[j][0], nodes[j][1])], fill=(*MERCURY, alpha_line), width=1)
    for i, (x, y) in enumerate(nodes):
        colour = (*GREEN, alpha_node) if i % 4 == 0 else (*MERCURY, alpha_node - 25)
        r = 3 if i % 4 == 0 else 2
        d.ellipse([x - r, y - r, x + r, y + r], fill=colour)
    return Image.alpha_composite(card, overlay)


def cutout(src: Path) -> Image.Image:
    """Key out the near-white studio background with a feathered edge."""
    im = Image.open(src).convert("RGB")
    px = im.load()
    alpha = Image.new("L", im.size, 0)
    ap = alpha.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            dist = 255 - min(r, g, b)
            ap[x, y] = 0 if dist <= 10 else (255 if dist >= 34 else int((dist - 10) / 24 * 255))
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.2))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    return out


def logo(width: int) -> Image.Image:
    im = Image.open("public/images/logo.png").convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    im.thumbnail((width, width), Image.LANCZOS)
    return im


def chips(card: Image.Image, x: int, y: int, items: list[str], border: tuple[int, int, int] = GREEN) -> int:
    d = ImageDraw.Draw(card)
    f = font("consola.ttf", 26)
    for text in items:
        w = d.textlength(text, font=f)
        d.rounded_rectangle([x, y, x + w + 44, y + 52], radius=26, outline=(*border, 170), width=2, fill=(0, 0, 0, 90))
        d.text((x + 22, y + 13), text, font=f, fill=(*GOLD, 255))
        y += 66
    return y


def footer(card: Image.Image, tagline: str) -> None:
    d = ImageDraw.Draw(card)
    d.line([(72, SIZE - 104), (SIZE - 72, SIZE - 104)], fill=(*GOLD, 70), width=1)
    d.text((72, SIZE - 84), "antidosis.com", font=font("segoeuib.ttf", 30), fill=(*GOLD, 255))
    w = d.textlength("antidosis.com", font=font("segoeuib.ttf", 30))
    d.text((72 + w + 16, SIZE - 78), tagline, font=font("consola.ttf", 24), fill=(*ASH, 255))


def base_card(stops, glows, seed=7) -> Image.Image:
    card = gradient(stops).convert("RGBA")
    for box, color, strength in glows:
        card = glow(card, box, color, strength)
    return mesh_field(card, seed=seed)


# ---------- cards ----------

def hero() -> None:
    card = base_card(
        [(0.0, (8, 12, 8)), (0.45, (12, 26, 16)), (1.0, (30, 22, 8))],
        [((340, 300, 1350, 1250), (24, 92, 48), 70), ((-260, 780, 520, 1460), (96, 58, 10), 60)],
    )

    lg = logo(300)
    card.alpha_composite(lg, (72, 64))

    device = cutout(STORE / "wio-tracker-l1-3.webp")
    device.thumbnail((720, 720), Image.LANCZOS)
    dx, dy = SIZE - device.width - 20, (SIZE - device.height) // 2 + 90
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse(
        [dx + device.width * 0.14, dy + device.height * 0.88, dx + device.width * 0.92, dy + device.height * 1.0],
        fill=(0, 0, 0, 140),
    )
    card = Image.alpha_composite(card, shadow.filter(ImageFilter.GaussianBlur(20)))
    halo = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ImageDraw.Draw(halo).ellipse(
        [dx - 60, dy - 40, dx + device.width + 60, dy + device.height + 40], fill=(*GREEN, 34)
    )
    card = Image.alpha_composite(card, halo.filter(ImageFilter.GaussianBlur(90)))
    card.alpha_composite(device, (dx, dy))

    d = ImageDraw.Draw(card)
    d.text((72, 330), "READY OUT", font=font("segoeuib.ttf", 100), fill=(*GOLD, 255))
    d.text((72, 442), "OF THE BOX", font=font("segoeuib.ttf", 100), fill=(*GOLD, 255))
    d.rectangle([74, 576, 208, 583], fill=(*SUN, 255))
    chips(card, 72, 618, ["MESHCORE PRE-FLASHED", "AUSTRALIA MID · 915.075 MHZ", "GPS + 2,000 MAH BATTERY"])

    footer(card, "·  sold & supported on the Central Coast")
    card.convert("RGB").save(STORE / "wio-tracker-hero.webp", "WEBP", quality=90)
    print("wrote wio-tracker-hero.webp")


def checklist() -> None:
    card = base_card(
        [(0.0, (6, 10, 14)), (0.5, (8, 24, 26)), (1.0, (14, 34, 18))],
        [((-300, -260, 620, 560), (0, 70, 84), 62), ((620, 700, 1500, 1500), (20, 80, 40), 66)],
        seed=11,
    )

    lg = logo(300)
    card.alpha_composite(lg, (72, 64))

    device = cutout(STORE / "wio-tracker-l1-2.webp")
    device.thumbnail((560, 560), Image.LANCZOS)
    dx, dy = SIZE - device.width - 60, (SIZE - device.height) // 2 + 110
    halo = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ImageDraw.Draw(halo).ellipse(
        [dx - 50, dy - 30, dx + device.width + 50, dy + device.height + 30], fill=(*MERCURY, 26)
    )
    card = Image.alpha_composite(card, halo.filter(ImageFilter.GaussianBlur(80)))
    card.alpha_composite(device, (dx, dy))

    d = ImageDraw.Draw(card)
    d.text((72, 330), "FLASHED. TESTED.", font=font("segoeuib.ttf", 76), fill=(*GOLD, 255))
    d.text((72, 420), "NAMED.", font=font("segoeuib.ttf", 76), fill=(*GOLD, 255))
    d.rectangle([74, 534, 208, 541], fill=(*SUN, 255))

    f = font("consola.ttf", 28)
    items = [
        "Flashed to YOUR mesh name",
        "Australia Mid profile, 915 MHz",
        "Charged to full before dispatch",
        "Test-messaged on the Coast network",
        "One-page start sheet in the box",
    ]
    y = 586
    for text in items:
        d.ellipse([76, y + 8, 96, y + 28], outline=(*GREEN, 255), width=3)
        d.line([(81, y + 18), (86, y + 24), (93, y + 11)], fill=(*GREEN, 255), width=3)
        d.text((116, y), text, font=f, fill=(*GOLD, 235))
        y += 56

    footer(card, "·  every unit, every time")
    card.convert("RGB").save(STORE / "wio-tracker-checklist.webp", "WEBP", quality=90)
    print("wrote wio-tracker-checklist.webp")


def framed(src: str, out: str, caption: str, sub: str, seed: int) -> None:
    """Photo panel on a branded card — Play-Store screenshot style."""
    card = base_card(
        [(0.0, (10, 9, 7)), (0.55, (16, 22, 14)), (1.0, (26, 20, 8))],
        [((760, -320, 1560, 420), (22, 78, 40), 56), ((-360, 820, 480, 1520), (90, 54, 10), 52)],
        seed=seed,
    )

    lg = logo(200)
    card.alpha_composite(lg, (72, 52))
    caption_y = 52 + lg.height + 36

    photo = Image.open(STORE / src).convert("RGB")
    panel_w = 860
    photo.thumbnail((panel_w, 700), Image.LANCZOS)
    frame = Image.new("RGBA", (photo.width + 8, photo.height + 8), (0, 0, 0, 0))
    mask = Image.new("L", photo.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, photo.width, photo.height], radius=26, fill=255)
    frame.paste(photo, (4, 4), mask)
    fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle(
        [0, 0, frame.width - 1, frame.height - 1], radius=30, outline=(*GOLD, 110), width=2
    )
    panel_y = caption_y + 140
    card.alpha_composite(frame, ((SIZE - frame.width) // 2, panel_y))

    d = ImageDraw.Draw(card)
    d.text((72, caption_y), caption, font=font("segoeuib.ttf", 58), fill=(*GOLD, 255))
    d.rectangle([74, caption_y + 86, 174, 92 + caption_y], fill=(*SUN, 255))
    d.text((72, panel_y + frame.height + 22), sub, font=font("consola.ttf", 28), fill=(*MERCURY, 235))

    footer(card, "·  wio tracker l1 pro")
    card.convert("RGB").save(STORE / out, "WEBP", quality=90)
    print(f"wrote {out}")


def dimensions() -> None:
    im = Image.open(STORE / "wio-tracker-l1-5.webp").convert("RGB")
    d = ImageDraw.Draw(im)
    d.rectangle([int(im.width * 0.6), 0, im.width, int(im.height * 0.2)], fill=(255, 255, 255))
    d.text(
        (int(im.width * 0.63), int(im.height * 0.06)),
        "Wio Tracker L1 Pro",
        font=font("segoeuib.ttf", 44),
        fill=(90, 90, 90),
    )
    im.save(STORE / "wio-tracker-dimensions.webp", "WEBP", quality=88)
    print("wrote wio-tracker-dimensions.webp")


def p1_pro() -> None:
    """Branded cards for the made-to-order P1-Pro solar repeater."""
    card = base_card(
        [(0.0, (8, 12, 8)), (0.45, (12, 26, 16)), (1.0, (30, 22, 8))],
        [((340, 300, 1350, 1250), (24, 92, 48), 70), ((-260, 780, 520, 1460), (96, 58, 10), 60)],
        seed=17,
    )

    lg = logo(300)
    card.alpha_composite(lg, (72, 64))

    device = cutout(STORE / "p1-pro-5.webp")
    device.thumbnail((700, 700), Image.LANCZOS)
    dx, dy = SIZE - device.width - 30, (SIZE - device.height) // 2 + 110
    halo = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ImageDraw.Draw(halo).ellipse(
        [dx - 60, dy - 40, dx + device.width + 60, dy + device.height + 40], fill=(*GREEN, 34)
    )
    card = Image.alpha_composite(card, halo.filter(ImageFilter.GaussianBlur(90)))
    card.alpha_composite(device, (dx, dy))

    d = ImageDraw.Draw(card)
    d.text((72, 330), "YOUR STREET,", font=font("segoeuib.ttf", 84), fill=(*GOLD, 255))
    d.text((72, 428), "ON THE AIR.", font=font("segoeuib.ttf", 84), fill=(*GOLD, 255))
    d.rectangle([74, 546, 208, 553], fill=(*SUN, 255))
    chips(card, 72, 588, ["SOLAR MESHCORE REPEATER", "AUSTRALIA MID · 915 MHZ", "POLE OR WALL MOUNT"])

    footer(card, "·  flashed, tested & shipped by us")
    card.convert("RGB").save(STORE / "p1-pro-hero.webp", "WEBP", quality=90)
    print("wrote p1-pro-hero.webp")

    card = base_card(
        [(0.0, (6, 10, 14)), (0.5, (8, 24, 26)), (1.0, (14, 34, 18))],
        [((-300, -260, 620, 560), (0, 70, 84), 62), ((620, 700, 1500, 1500), (20, 80, 40), 66)],
        seed=19,
    )

    lg = logo(300)
    card.alpha_composite(lg, (72, 64))

    d = ImageDraw.Draw(card)
    d.text((72, 330), "ORDERED FOR YOU.", font=font("segoeuib.ttf", 72), fill=(*GOLD, 255))
    d.rectangle([74, 434, 208, 441], fill=(*SUN, 255))

    f = font("consola.ttf", 28)
    items = [
        "We order your unit the day you pay",
        "It lands with us in ~2–3 weeks",
        "Flashed to Australia Mid, 915 MHz",
        "Tested on the live Coast network",
        "Shipped AusPost tracked — 3–4 weeks total",
    ]
    y = 486
    for text in items:
        d.ellipse([76, y + 8, 96, y + 28], outline=(*GREEN, 255), width=3)
        d.line([(81, y + 18), (86, y + 24), (93, y + 11)], fill=(*GREEN, 255), width=3)
        d.text((116, y), text, font=f, fill=(*GOLD, 235))
        y += 56

    d.text((72, y + 30), "why the wait? no warehouse, no dead stock —", font=font("consola.ttf", 26), fill=(*ASH, 255))
    d.text((72, y + 68), "every repeater is configured fresh for you.", font=font("consola.ttf", 26), fill=(*ASH, 255))

    footer(card, "·  honest delivery, every time")
    card.convert("RGB").save(STORE / "p1-pro-mto.webp", "WEBP", quality=90)
    print("wrote p1-pro-mto.webp")


if __name__ == "__main__":
    hero()
    checklist()
    framed(
        "wio-tracker-l1-4.webp",
        "wio-tracker-ports.webp",
        "Charge. Configure. Go.",
        "USB-C charging + data — no proprietary cables",
        seed=13,
    )
    dimensions()
    p1_pro()
