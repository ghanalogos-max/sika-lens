"""Generate brand tiles for missing banks + subscription services (offline, no network)."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BRANDS = ROOT / "assets" / "brands"
SUBS = ROOT / "assets" / "subscriptions"
SIZE = 256


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in ("segoeuib.ttf", "arialbd.ttf", "seguisb.ttf"):
        path = Path("C:/Windows/Fonts") / name
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size)
            except OSError:
                pass
    return ImageFont.load_default()


def tile(bg: tuple[int, int, int], text: str, fg: tuple[int, int, int] = (255, 255, 255)) -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), bg)
    draw = ImageDraw.Draw(img)
    f = font(72 if len(text) <= 3 else 44 if len(text) <= 6 else 32)
    bbox = draw.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((SIZE - tw) / 2, (SIZE - th) / 2 - 4), text, font=f, fill=fg)
    return img


def spotify() -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), (25, 20, 20))
    draw = ImageDraw.Draw(img)
    draw.ellipse((24, 24, SIZE - 24, SIZE - 24), fill=(30, 215, 96))
    for i, (y, inset) in enumerate(((95, 48), (130, 58), (165, 68))):
        draw.arc((inset, y, SIZE - inset, y + 70), 200, 340, fill=(25, 20, 20), width=14 - i * 2)
    return img


def chatgpt() -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), (16, 163, 127))
    draw = ImageDraw.Draw(img)
    cx = cy = SIZE // 2
    for ang in range(0, 360, 60):
        rad = math.radians(ang)
        x = cx + int(math.cos(rad) * 38)
        y = cy + int(math.sin(rad) * 38)
        draw.ellipse((x - 28, y - 28, x + 28, y + 28), outline=(255, 255, 255), width=8)
    draw.ellipse((cx - 36, cy - 36, cx + 36, cy + 36), fill=(16, 163, 127))
    return img


def netflix() -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.polygon([(78, 48), (108, 48), (148, 208), (118, 208)], fill=(229, 9, 20))
    draw.polygon([(148, 48), (178, 48), (178, 208), (148, 208)], fill=(178, 7, 16))
    draw.polygon([(78, 48), (108, 48), (178, 208), (148, 208)], fill=(229, 9, 20))
    return img


def youtube() -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((40, 72, SIZE - 40, SIZE - 72), radius=36, fill=(255, 0, 0))
    draw.polygon([(108, 100), (108, 156), (168, 128)], fill=(255, 255, 255))
    return img


def save(path: Path, img: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)}")


def main() -> None:
    BRANDS.mkdir(parents=True, exist_ok=True)
    SUBS.mkdir(parents=True, exist_ok=True)

    save(BRANDS / "standard_chartered.png", tile((0, 114, 170), "SC"))
    save(BRANDS / "ghl.png", tile((200, 16, 46), "GHL"))

    save(SUBS / "spotify.png", spotify())
    save(SUBS / "chatgpt.png", chatgpt())
    save(SUBS / "claude.png", tile((217, 119, 87), "Claude"))
    save(SUBS / "netflix.png", netflix())
    save(SUBS / "youtube.png", youtube())
    save(SUBS / "apple_music.png", tile((250, 45, 85), "Music"))
    save(SUBS / "disney.png", tile((17, 60, 207), "Disney+"))
    save(SUBS / "microsoft365.png", tile((210, 71, 38), "365"))
    save(SUBS / "icloud.png", tile((54, 145, 247), "iCloud"))
    save(SUBS / "adobe.png", tile((235, 20, 35), "Ae"))


if __name__ == "__main__":
    main()
