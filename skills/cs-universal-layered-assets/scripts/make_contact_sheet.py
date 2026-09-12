#!/usr/bin/env python3
"""Create a labeled contact sheet from separate style preview candidates."""

from __future__ import annotations

import argparse
import math
from pathlib import Path
import string
import sys


def _load_image():
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("Error: Pillow is required. Install it with `python -m pip install pillow`.", file=sys.stderr)
        raise SystemExit(1)
    return Image, ImageDraw, ImageFont


def _resampling_lanczos(Image):
    return getattr(getattr(Image, "Resampling", Image), "LANCZOS")


def _label_for(index: int) -> str:
    letters = string.ascii_uppercase
    if index < len(letters):
        return letters[index]
    return f"Option {index + 1}"


def make_sheet(inputs: list[Path], output: Path, columns: int, tile_width: int, padding: int, background: str) -> None:
    Image, ImageDraw, ImageFont = _load_image()
    images = []
    for path in inputs:
        if not path.exists():
            print(f"Error: input not found: {path}", file=sys.stderr)
            raise SystemExit(1)
        images.append(Image.open(path).convert("RGB"))

    columns = max(1, min(columns, len(images)))
    rows = int(math.ceil(len(images) / columns))
    label_height = 42
    tile_sizes: list[tuple[int, int]] = []
    resized = []

    for image in images:
        ratio = tile_width / image.width
        size = (tile_width, max(1, int(round(image.height * ratio))))
        resized.append(image.resize(size, _resampling_lanczos(Image)))
        tile_sizes.append(size)

    tile_height = max(height for _, height in tile_sizes)
    sheet_width = columns * tile_width + (columns + 1) * padding
    sheet_height = rows * (tile_height + label_height) + (rows + 1) * padding
    sheet = Image.new("RGB", (sheet_width, sheet_height), background)
    draw = ImageDraw.Draw(sheet)

    try:
        font = ImageFont.truetype("Arial.ttf", 24)
    except OSError:
        font = ImageFont.load_default()

    for index, image in enumerate(resized):
        row = index // columns
        col = index % columns
        x = padding + col * (tile_width + padding)
        y = padding + row * (tile_height + label_height + padding)
        sheet.paste(image, (x, y))

        label = _label_for(index)
        label_y = y + tile_height + 10
        draw.text((x, label_y), label, fill=(245, 245, 245), font=font)

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a labeled style preview contact sheet.")
    parser.add_argument("--input", action="append", required=True, type=Path, help="Preview candidate image. Repeat for each option.")
    parser.add_argument("--out", required=True, type=Path, help="Output contact sheet image.")
    parser.add_argument("--columns", type=int, default=2, help="Number of columns.")
    parser.add_argument("--tile-width", type=int, default=512, help="Width for each candidate tile.")
    parser.add_argument("--padding", type=int, default=24, help="Padding between tiles.")
    parser.add_argument("--background", default="#111111", help="Sheet background color.")
    args = parser.parse_args()

    make_sheet(args.input, args.out, args.columns, args.tile_width, args.padding, args.background)
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
