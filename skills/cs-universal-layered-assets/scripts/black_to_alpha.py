#!/usr/bin/env python3
"""Convert pure-black-source light, cloud, mist, or particle images to alpha PNG."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys


def _load_image():
    try:
        from PIL import Image
    except ImportError:
        print("Error: Pillow is required. Install it with `python -m pip install pillow`.", file=sys.stderr)
        raise SystemExit(1)
    return Image


def _clamp_byte(value: float) -> int:
    return max(0, min(255, int(round(value))))


def convert(input_path: Path, output_path: Path, black_point: float, white_point: float, gamma: float) -> None:
    Image = _load_image()
    image = Image.open(input_path).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    denominator = max(1.0, white_point - black_point)

    out = Image.new("RGBA", image.size)
    out_pixels = out.load()

    for y in range(height):
        for x in range(width):
            red, green, blue, source_alpha = pixels[x, y]
            brightness = max(red, green, blue)
            normalized = max(0.0, min(1.0, (brightness - black_point) / denominator))
            alpha = (normalized ** gamma) * (source_alpha / 255.0)

            if alpha <= 0:
                out_pixels[x, y] = (0, 0, 0, 0)
                continue

            scale = 255.0 / max(1.0, float(brightness))
            out_pixels[x, y] = (
                _clamp_byte(red * scale),
                _clamp_byte(green * scale),
                _clamp_byte(blue * scale),
                _clamp_byte(alpha * 255.0),
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(output_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert a black-background overlay source to alpha PNG.")
    parser.add_argument("--input", required=True, type=Path, help="Input black-source image.")
    parser.add_argument("--out", required=True, type=Path, help="Output alpha PNG.")
    parser.add_argument("--black-point", type=float, default=3.0, help="Brightness mapped to fully transparent.")
    parser.add_argument("--white-point", type=float, default=220.0, help="Brightness mapped near fully opaque.")
    parser.add_argument("--gamma", type=float, default=0.82, help="Alpha curve gamma.")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Error: input not found: {args.input}", file=sys.stderr)
        raise SystemExit(1)
    if args.out.suffix.lower() != ".png":
        print("Error: --out must be a .png file to preserve alpha.", file=sys.stderr)
        raise SystemExit(1)

    convert(args.input, args.out, args.black_point, args.white_point, args.gamma)
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
