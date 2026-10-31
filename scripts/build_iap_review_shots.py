"""Build App Review screenshots for SikaLens Premium subscriptions (1290×2796)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "store" / "iap-review"
SIZE = (1290, 2796)  # iPhone 6.7″ — valid App Review screenshot size

BG = (247, 249, 250)
INK = (15, 28, 32)
INK_SOFT = (90, 110, 116)
PRIMARY = (14, 106, 98)
GOLD = (168, 107, 18)
GOLD_SOFT = (248, 237, 216)
SURFACE = (255, 255, 255)
LINE = (220, 228, 230)
WHITE = (255, 255, 255)

PLANS = [
    {
        "id": "weekly",
        "file": "premium_weekly.png",
        "title": "Weekly",
        "price": "$0.99",
        "period": "/ week",
        "blurb": "Try it for a week. Cancel anytime.",
        "ghs": "About GHS 15.05",
        "badge": None,
    },
    {
        "id": "monthly",
        "file": "premium_monthly.png",
        "title": "Monthly",
        "price": "$1.99",
        "period": "/ month",
        "blurb": "Most flexible. Renews each month.",
        "ghs": "About GHS 30.25",
        "badge": None,
    },
    {
        "id": "annual",
        "file": "premium_annual.png",
        "title": "Yearly",
        "price": "$14.99",
        "period": "/ year",
        "blurb": "Best value — about 2 months free vs monthly.",
        "ghs": "About GHS 227.85",
        "badge": "Save 37%",
    },
]

PERKS = [
    ("Full MoMo history", "Keep every imported message"),
    ("Every wallet", "Track all MoMo and bank accounts"),
    ("Earlier months", "Budgets, trends, and fee totals"),
    ("Themes & export", "Colour washes plus PDF / Excel"),
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def round_rect(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, ...],
    outline: tuple[int, ...] | None = None,
    width: int = 1,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_shot(selected_id: str) -> Image.Image:
    w, h = SIZE
    img = Image.new("RGB", SIZE, BG)
    draw = ImageDraw.Draw(img)

    # Soft lagoon wash at top
    for y in range(0, 520):
        t = y / 520
        r = int(247 + (227 - 247) * (1 - t) * 0.35)
        g = int(249 + (243 - 249) * (1 - t) * 0.35)
        b = int(250 + (240 - 250) * (1 - t) * 0.35)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    pad = 72
    y = 120

    # Status bar hint
    draw.text((pad, 48), "9:41", fill=INK, font=font(28, True))
    draw.text((w - pad - 120, 48), "SikaLens", fill=INK_SOFT, font=font(24))

    # Title row
    draw.ellipse((pad, y, pad + 56, y + 56), fill=GOLD_SOFT)
    draw.text((pad + 12, y + 6), "◆", fill=GOLD, font=font(36, True))
    draw.text((pad + 72, y - 4), "Premium", fill=INK, font=font(64, True))
    y += 88
    draw.text(
        (pad, y),
        "Bank and MoMo logos stay free. Prices in US dollars;",
        fill=INK_SOFT,
        font=font(28),
    )
    y += 40
    draw.text((pad, y), "App Store charges in your local currency.", fill=INK_SOFT, font=font(28))
    y += 72

    for title, body in PERKS:
        draw.ellipse((pad, y + 4, pad + 36, y + 40), fill=(227, 243, 240))
        draw.text((pad + 8, y + 4), "✓", fill=PRIMARY, font=font(26, True))
        draw.text((pad + 52, y), title, fill=INK, font=font(30, True))
        draw.text((pad + 52, y + 40), body, fill=INK_SOFT, font=font(26))
        y += 96

    y += 16

    for plan in PLANS:
        on = plan["id"] == selected_id
        box = (pad, y, w - pad, y + 168)
        round_rect(
            draw,
            box,
            28,
            GOLD_SOFT if on else SURFACE,
            outline=GOLD if on else LINE,
            width=4 if on else 2,
        )
        # radio
        cx, cy = pad + 48, y + 84
        draw.ellipse((cx - 18, cy - 18, cx + 18, cy + 18), outline=GOLD if on else INK_SOFT, width=3)
        if on:
            draw.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=GOLD)

        tx = pad + 90
        draw.text((tx, y + 28), plan["title"], fill=INK, font=font(34, True))
        if plan["badge"]:
            bx = tx + 140
            round_rect(draw, (bx, y + 30, bx + 150, y + 66), 16, GOLD)
            draw.text((bx + 18, y + 34), plan["badge"], fill=WHITE, font=font(22, True))
        draw.text((tx, y + 78), plan["blurb"], fill=INK_SOFT, font=font(24))
        draw.text((tx, y + 116), plan["ghs"], fill=INK_SOFT, font=font(24))

        # price right
        pw = draw.textlength(plan["price"], font=font(34, True))
        draw.text((w - pad - 40 - pw, y + 48), plan["price"], fill=INK, font=font(34, True))
        pp = draw.textlength(plan["period"], font=font(24))
        draw.text((w - pad - 40 - pp, y + 96), plan["period"], fill=INK_SOFT, font=font(24))
        y += 188

    # CTA
    selected = next(p for p in PLANS if p["id"] == selected_id)
    cta = (pad, y + 12, w - pad, y + 120)
    round_rect(draw, cta, 28, GOLD)
    label = f"Continue · {selected['price']}"
    lw = draw.textlength(label, font=font(34, True))
    draw.text(((w - lw) / 2, y + 44), label, fill=WHITE, font=font(34, True))
    y += 150

    restore = "Restore purchases"
    rw = draw.textlength(restore, font=font(30, True))
    draw.text(((w - rw) / 2, y), restore, fill=PRIMARY, font=font(30, True))
    y += 56

    foot = "Billed through App Store. Renews until cancelled."
    fw = draw.textlength(foot, font=font(24))
    draw.text(((w - fw) / 2, y), foot, fill=INK_SOFT, font=font(24))

    # Product callout for App Review clarity
    tag = f"Product: premium_{selected_id if selected_id != 'annual' else 'annual'}"
    if selected_id == "annual":
        tag = "Product: premium_annual"
    elif selected_id == "weekly":
        tag = "Product: premium_weekly"
    else:
        tag = "Product: premium_monthly"
    tw = draw.textlength(tag, font=font(26, True))
    round_rect(draw, ((w - tw) / 2 - 28, h - 120, (w + tw) / 2 + 28, h - 60), 20, (227, 243, 240))
    draw.text(((w - tw) / 2, h - 108), tag, fill=PRIMARY, font=font(26, True))

    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for plan in PLANS:
        shot = draw_shot(plan["id"])
        path = OUT / plan["file"]
        shot.save(path, format="PNG", optimize=True)
        assert shot.size == SIZE and shot.mode == "RGB"
        print(f"Wrote {path} {shot.size}")


if __name__ == "__main__":
    main()
