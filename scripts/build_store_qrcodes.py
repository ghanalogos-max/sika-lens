"""Generate Play / App Store QR PNGs for the marketing site."""

from __future__ import annotations

from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_M

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "website" / "store"

PLAY = "https://play.google.com/store/apps/details?id=com.sikalens.app"
APPLE = "https://apps.apple.com/app/id6826582927"
SITE = "https://www.sikalens.app/#get-app"

TEAL = (14, 106, 98)


def write_qr(url: str, path: Path, box: int = 10) -> None:
    qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_M, box_size=box, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=TEAL, back_color="white").convert("RGB")
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} ({img.size[0]}x{img.size[1]}) -> {url}")


def main() -> None:
    write_qr(PLAY, OUT / "qr-play.png")
    write_qr(APPLE, OUT / "qr-apple.png")
    write_qr(SITE, OUT / "qr-get-app.png", box=12)


if __name__ == "__main__":
    main()
