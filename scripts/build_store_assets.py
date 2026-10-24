"""Build Play Store / App Store icons, feature graphic, and screenshots from mockups."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MOCKUPS = ROOT / "mockups"
OUT_PLAY = ROOT / "store" / "play"
OUT_APPLE = ROOT / "store" / "appstore"
OUT_WEB = ROOT / "website" / "store"
ICON_SRC = ROOT / "assets" / "images" / "icon.png"

# Best actual UI shots for store listings (skip Expo loading splash).
SHOTS = [
    ("01-lock", "WhatsApp Image 2026-10-24 at 08.42.13 (4).jpeg"),
    ("02-home", "WhatsApp Image 2026-10-24 at 08.42.13 (3).jpeg"),
    ("03-activity", "WhatsApp Image 2026-10-24 at 08.42.12 (3).jpeg"),
    ("04-insights", "WhatsApp Image 2026-10-24 at 08.42.12 (1).jpeg"),
    ("05-budgets", "WhatsApp Image 2026-10-24 at 08.42.12 (2).jpeg"),
    ("06-momo-networks", "WhatsApp Image 2026-10-24 at 08.42.11.jpeg"),
    ("07-choose-bank", "WhatsApp Image 2026-10-24 at 08.42.12.jpeg"),
    ("08-settings", "WhatsApp Image 2026-10-24 at 08.42.13.jpeg"),
    ("09-currency", "WhatsApp Image 2026-10-24 at 08.42.13 (2).jpeg"),
]

PLAY_SHOT = (1080, 1920)  # 9:16 phone
APPLE_67 = (1290, 2796)  # iPhone 6.7"


def cover_resize(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    tw, th = size
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def solid_icon(size: int) -> Image.Image:
    """App Store rejects icons with transparency; flatten onto brand teal."""
    src = Image.open(ICON_SRC).convert("RGBA")
    canvas = Image.new("RGB", (size, size), (14, 106, 98))  # #0E6A62
    fitted = cover_resize(src, (size, size)).convert("RGBA")
    canvas.paste(fitted, (0, 0), fitted)
    return canvas


def build_feature_graphic() -> Image.Image:
    """Exact 1024x500 Play feature graphic — icon + brand text on solid teal."""
    w, h = 1024, 500
    teal = (14, 106, 98)
    deep = (10, 79, 73)
    img = Image.new("RGB", (w, h), teal)
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 380, h), fill=deep)

    icon = solid_icon(240)
    mask = Image.new("L", (240, 240), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 239, 239), radius=52, fill=255)
    rounded = Image.new("RGBA", (240, 240), (0, 0, 0, 0))
    rounded.paste(icon.convert("RGBA"), (0, 0), mask)
    base = img.convert("RGBA")
    base.paste(rounded, (70, (h - 240) // 2), rounded)
    img = base.convert("RGB")
    draw = ImageDraw.Draw(img)

    try:
        title_font = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 78)
        sub_font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 34)
    except OSError:
        title_font = ImageFont.load_default()
        sub_font = title_font

    draw.text((420, 168), "SikaLens", fill="white", font=title_font)
    draw.text((420, 270), "MoMo & bank tracker for Ghana", fill=(232, 244, 241), font=sub_font)
    return img


def save_rgb(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(path, "PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} ({img.size[0]}x{img.size[1]})")


def main() -> None:
    for d in (OUT_PLAY / "screenshots", OUT_APPLE / "screenshots-6.7", OUT_WEB / "screenshots"):
        d.mkdir(parents=True, exist_ok=True)

    save_rgb(solid_icon(512), OUT_PLAY / "icon-512.png")
    save_rgb(solid_icon(1024), OUT_APPLE / "icon-1024.png")
    save_rgb(solid_icon(512), OUT_WEB / "icon-512.png")
    save_rgb(solid_icon(1024), OUT_WEB / "icon-1024.png")

    feature = build_feature_graphic()
    save_rgb(feature, OUT_PLAY / "feature-graphic-1024x500.png")
    save_rgb(feature, OUT_WEB / "feature-graphic.png")

    for slug, filename in SHOTS:
        src_path = MOCKUPS / filename
        if not src_path.exists():
            print(f"MISSING {src_path}")
            continue
        shot = Image.open(src_path).convert("RGB")
        play = cover_resize(shot, PLAY_SHOT)
        apple = cover_resize(shot, APPLE_67)
        web = cover_resize(shot, (720, 1280))
        save_rgb(play, OUT_PLAY / "screenshots" / f"{slug}.png")
        save_rgb(apple, OUT_APPLE / "screenshots-6.7" / f"{slug}.png")
        save_rgb(web, OUT_WEB / "screenshots" / f"{slug}.png")

    # Manifest for humans uploading to consoles
    readme = ROOT / "store" / "README.md"
    readme.write_text(
        """# Store listing assets

Generated from device screenshots in `/mockups` plus the app icon.

## Google Play

| Asset | File | Spec |
|-------|------|------|
| App icon | `play/icon-512.png` | 512×512 PNG, 32-bit |
| Feature graphic | `play/feature-graphic-1024x500.png` | 1024×500 PNG |
| Phone screenshots | `play/screenshots/*.png` | 1080×1920 (9:16), upload at least 2 |

Upload order suggestion: lock → home → activity → insights → budgets → MoMo → bank → settings → currency.

## Apple App Store

| Asset | File | Spec |
|-------|------|------|
| App icon | `appstore/icon-1024.png` | 1024×1024 PNG, no transparency |
| iPhone 6.7\" screenshots | `appstore/screenshots-6.7/*.png` | 1290×2796 |

Also upload the same set scaled for other required sizes in App Store Connect if prompted (use these as the primary 6.7\" set).

## Website

Copies used by the marketing site live in `website/store/`.
""",
        encoding="utf-8",
    )
    print(f"wrote {readme.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
