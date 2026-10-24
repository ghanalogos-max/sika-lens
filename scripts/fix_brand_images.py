"""Re-encode brand logos as AAPT2-safe RGB/RGBA PNGs (and keep JPGs as JPEG)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRANDS = ROOT / "assets" / "brands"


def fix_file(path: Path) -> str:
    raw = path.read_bytes()[:8]
    is_png_magic = raw.startswith(b"\x89PNG\r\n\x1a\n")
    is_jpeg_magic = raw.startswith(b"\xff\xd8\xff")

    im = Image.open(path)
    im.load()

    # Flatten to a normal PNG AAPT2 accepts: 8-bit RGB or RGBA, no weird modes.
    if im.mode in ("P", "PA"):
        im = im.convert("RGBA")
    elif im.mode == "CMYK":
        im = im.convert("RGB")
    elif im.mode == "LA":
        im = im.convert("RGBA")
    elif im.mode == "L":
        im = im.convert("RGB")
    elif im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")

    # If file extension is .png but content was JPEG (or broken), force PNG rewrite.
    if path.suffix.lower() == ".png":
        # Prefer opaque RGB when no useful alpha (smaller + safer for AAPT).
        if im.mode == "RGBA":
            alpha = im.getchannel("A")
            if alpha.getextrema() == (255, 255):
                im = im.convert("RGB")
        out = path
        im.save(out, format="PNG", optimize=True)
        return f"rewrote PNG {path.name} mode={im.mode} magic_ok={is_png_magic}"

    if path.suffix.lower() in {".jpg", ".jpeg"}:
        if im.mode != "RGB":
            im = im.convert("RGB")
        im.save(path, format="JPEG", quality=92, optimize=True)
        return f"rewrote JPEG {path.name} magic_ok={is_jpeg_magic}"

    return f"skipped {path.name}"


def main() -> None:
    for path in sorted(BRANDS.iterdir()):
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            continue
        try:
            print(fix_file(path))
        except Exception as exc:  # noqa: BLE001
            print(f"FAILED {path.name}: {exc}")


if __name__ == "__main__":
    main()
