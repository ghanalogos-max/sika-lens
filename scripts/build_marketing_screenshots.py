"""Build branded App Store marketing screenshots (logo + caption + phone) from iPhone mockups.

Outputs exact ASC sizes:
  - iPhone 6.7″ (large): 1290×2796 → store/appstore/screenshots-6.7/
  - iPhone 6.1″/6.3″ (medium Dynamic Island): 1206×2622 → store/appstore/screenshots-6.1/
"""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MOCK_IPHONE = ROOT / "mockups" / "iphone"
OUT_67 = ROOT / "store" / "appstore" / "screenshots-6.7"
OUT_61 = ROOT / "store" / "appstore" / "screenshots-6.1"
OUT_WEB_MKT = ROOT / "website" / "store" / "screenshots-marketing"
OUT_WEB_UI = ROOT / "website" / "store" / "screenshots"  # clean iPhone UI for the marketing site
ICON_SRC = ROOT / "assets" / "images" / "icon.png"
WEB_UI_W = 720

# Apple App Store Connect portrait screenshot sizes
SIZE_67 = (1290, 2796)  # 6.7″ display
SIZE_61 = (1206, 2622)  # 6.1″ / 6.3″ Dynamic Island (medium)

TEAL = (14, 106, 98)
TEAL_DEEP = (8, 58, 54)
TEAL_MID = (12, 88, 82)
GOLD = (196, 137, 30)
WHITE = (255, 255, 255)
SOFT = (220, 236, 232)

SLIDES: list[tuple[str, str, str, str]] = [
    (
        "01-lock",
        "WhatsApp Image 2026-10-24 at 14.03.22.jpeg",
        "PIN-locked. Yours alone.",
        "Unlock MoMo & bank records on this phone",
    ),
    (
        "02-home",
        "WhatsApp Image 2026-10-24 at 14.03.22 (1).jpeg",
        "See where your MoMo goes",
        "Balances, wallets, and quick actions in GH₵",
    ),
    (
        "03-activity",
        "WhatsApp Image 2026-10-24 at 14.03.22 (2).jpeg",
        "Every move in one ledger",
        "Paste SMS or log transfers — offline-first",
    ),
    (
        "04-budgets",
        "WhatsApp Image 2026-10-24 at 14.03.22 (3).jpeg",
        "Budgets that match Ghana life",
        "Airtime, bills, business, cash-out limits",
    ),
    (
        "05-insights",
        "WhatsApp Image 2026-10-24 at 14.03.22 (4).jpeg",
        "Insights on your phone",
        "Monthly spend graphs stay on device",
    ),
    (
        "06-settings",
        "WhatsApp Image 2026-10-24 at 14.03.22 (5).jpeg",
        "Cedi-first. Themes you choose.",
        "Light, dark, Lagoon — Premium colours optional",
    ),
    (
        "07-wallets",
        "WhatsApp Image 2026-10-24 at 14.03.22 (7).jpeg",
        "MoMo & bank wallets together",
        "MTN, Telecel, AirtelTigo, and Ghana banks",
    ),
]


def font(name: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = Path("C:/Windows/Fonts") / name
    try:
        return ImageFont.truetype(str(path), size)
    except OSError:
        return ImageFont.load_default()


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def cover_fit(img: Image.Image, box: tuple[int, int]) -> Image.Image:
    tw, th = box
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def contain_fit(img: Image.Image, box: tuple[int, int]) -> Image.Image:
    tw, th = box
    sw, sh = img.size
    scale = min(tw / sw, th / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    return img.resize((nw, nh), Image.Resampling.LANCZOS)


def brand_icon(size: int) -> Image.Image:
    src = Image.open(ICON_SRC).convert("RGBA")
    fitted = cover_fit(src, (size, size)).convert("RGBA")
    mask = rounded_mask((size, size), radius=int(size * 0.22))
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(fitted, (0, 0), mask)
    return out


def draw_centered(draw: ImageDraw.ImageDraw, text: str, y: int, font_obj, fill, canvas_w: int) -> int:
    bbox = draw.textbbox((0, 0), text, font=font_obj)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((canvas_w - tw) // 2, y), text, font=font_obj, fill=fill)
    return th


def wrap_lines(text: str, font_obj, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textbbox((0, 0), trial, font=font_obj)[2] <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def compose_slide(shot: Image.Image, headline: str, subline: str, canvas_size: tuple[int, int]) -> Image.Image:
    w, h = canvas_size
    scale = w / 1290  # layout authored for 6.7″, scale to other sizes

    def s(v: float) -> int:
        return max(1, int(round(v * scale)))

    canvas = Image.new("RGB", (w, h), TEAL)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, w, int(h * 0.38)), fill=TEAL_DEEP)
    draw.rectangle((0, int(h * 0.38), w, h), fill=TEAL)

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((-s(200), int(h * 0.55), s(500), int(h * 0.55) + s(700)), fill=(*TEAL_MID, 70))
    od.ellipse((w - s(480), int(h * 0.72), w + s(120), h + s(200)), fill=(*GOLD, 28))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(canvas)

    title_f = font("segoeuib.ttf", s(64))
    sub_f = font("segoeui.ttf", s(34))
    word_f = font("segoeuib.ttf", s(42))
    tiny_f = font("segoeui.ttf", s(26))

    icon_sz = s(110)
    icon = brand_icon(icon_sz)
    canvas_rgba = canvas.convert("RGBA")
    ix = (w - icon_sz) // 2
    canvas_rgba.paste(icon, (ix, s(72)), icon)
    canvas = canvas_rgba.convert("RGB")
    draw = ImageDraw.Draw(canvas)
    draw_centered(draw, "SikaLens", s(200), word_f, WHITE, w)

    y = s(270)
    for line in wrap_lines(headline, title_f, w - s(140), draw):
        th = draw_centered(draw, line, y, title_f, WHITE, w)
        y += th + s(10)
    y += s(8)
    for line in wrap_lines(subline, sub_f, w - s(160), draw):
        th = draw_centered(draw, line, y, sub_f, SOFT, w)
        y += th + s(8)

    frame_w = s(980)
    frame_h = s(1960)
    frame_x = (w - frame_w) // 2
    frame_y = min(y + s(36), s(620))
    if frame_y + frame_h > h - s(80):
        frame_y = h - s(80) - frame_h

    bezel = s(18)
    radius = s(78)
    phone_outer = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    pod = ImageDraw.Draw(phone_outer)
    pod.rounded_rectangle((0, 0, frame_w - 1, frame_h - 1), radius=radius, fill=(20, 28, 30, 255))
    inner_box = (bezel, bezel, frame_w - bezel, frame_h - bezel)
    inner_w = inner_box[2] - inner_box[0]
    inner_h = inner_box[3] - inner_box[1]
    screen = contain_fit(shot.convert("RGB"), (inner_w, inner_h))
    screen_canvas = Image.new("RGB", (inner_w, inner_h), (12, 18, 20))
    sx = (inner_w - screen.size[0]) // 2
    sy = (inner_h - screen.size[1]) // 2
    screen_canvas.paste(screen, (sx, sy))
    screen_r = Image.new("RGBA", (inner_w, inner_h), (0, 0, 0, 0))
    smask = rounded_mask((inner_w, inner_h), radius=max(1, radius - s(10)))
    screen_r.paste(screen_canvas.convert("RGBA"), (0, 0), smask)
    phone_outer.paste(screen_r, (bezel, bezel), screen_r)

    base = canvas.convert("RGBA")
    base.paste(phone_outer, (frame_x, frame_y), phone_outer)
    canvas = base.convert("RGB")
    draw = ImageDraw.Draw(canvas)
    draw_centered(draw, "Offline MoMo & bank tracker for Ghana", h - s(56), tiny_f, SOFT, w)
    return canvas


def resolve_source(filename: str) -> Path | None:
    for base in (MOCK_IPHONE, OUT_67, OUT_61):
        candidate = base / filename
        if candidate.exists():
            return candidate
    return None


def export_web_ui(shot: Image.Image) -> Image.Image:
    """Clean device UI for the website (preserve aspect, no marketing chrome)."""
    sw, sh = shot.size
    nh = max(1, int(round(WEB_UI_W * sh / sw)))
    return shot.resize((WEB_UI_W, nh), Image.Resampling.LANCZOS)


def main() -> None:
    MOCK_IPHONE.mkdir(parents=True, exist_ok=True)
    OUT_67.mkdir(parents=True, exist_ok=True)
    OUT_61.mkdir(parents=True, exist_ok=True)
    OUT_WEB_MKT.mkdir(parents=True, exist_ok=True)
    OUT_WEB_UI.mkdir(parents=True, exist_ok=True)

    keep = {f"{slug}.png" for slug, *_ in SLIDES}

    for slug, filename, headline, subline in SLIDES:
        src = resolve_source(filename)
        if src is None:
            print(f"MISSING {filename}")
            continue
        # Prefer mockups copy
        dest = MOCK_IPHONE / filename
        if src != dest:
            shutil.copy2(src, dest)
            src = dest

        shot = Image.open(src).convert("RGB")

        slide_67 = compose_slide(shot, headline, subline, SIZE_67)
        out_67 = OUT_67 / f"{slug}.png"
        slide_67.save(out_67, "PNG", optimize=True)
        print(f"wrote {out_67.relative_to(ROOT)} {slide_67.size}")

        slide_61 = compose_slide(shot, headline, subline, SIZE_61)
        out_61 = OUT_61 / f"{slug}.png"
        slide_61.save(out_61, "PNG", optimize=True)
        print(f"wrote {out_61.relative_to(ROOT)} {slide_61.size}")

        web_mkt = slide_67.resize((720, 1560), Image.Resampling.LANCZOS)
        out_mkt = OUT_WEB_MKT / f"{slug}.png"
        web_mkt.save(out_mkt, "PNG", optimize=True)
        print(f"wrote {out_mkt.relative_to(ROOT)}")

        web_ui = export_web_ui(shot)
        out_ui = OUT_WEB_UI / f"{slug}.png"
        web_ui.save(out_ui, "PNG", optimize=True)
        print(f"wrote {out_ui.relative_to(ROOT)} {web_ui.size}")

    for folder in (OUT_67, OUT_61, OUT_WEB_MKT, OUT_WEB_UI):
        for p in folder.glob("WhatsApp Image*.jpeg"):
            p.unlink(missing_ok=True)
            print(f"removed raw {p.name} from {folder.name}")
        for p in list(folder.glob("*.png")):
            if p.name not in keep:
                p.unlink(missing_ok=True)
                print(f"removed obsolete {p.name}")


if __name__ == "__main__":
    main()
