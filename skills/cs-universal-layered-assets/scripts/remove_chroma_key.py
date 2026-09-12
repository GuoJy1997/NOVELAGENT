#!/usr/bin/env python3
"""Remove a flat chroma-key background and write an alpha PNG or WebP."""

from __future__ import annotations

import argparse
from pathlib import Path
import re
from statistics import median
import sys


Color = tuple[int, int, int]


def _load_pillow():
    try:
        from PIL import Image, ImageFilter
    except ImportError:
        print("Error: Pillow is required. Install it with `python -m pip install pillow`.", file=sys.stderr)
        raise SystemExit(1)
    return Image, ImageFilter


def _parse_color(raw: str) -> Color:
    match = re.fullmatch(r"#?([0-9a-fA-F]{6})", raw.strip())
    if not match:
        print("Error: --key-color must be a hex color such as #00ff00.", file=sys.stderr)
        raise SystemExit(1)
    value = match.group(1)
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))


def _distance(a: Color, b: Color) -> int:
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def _smoothstep(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def _clamp_byte(value: float) -> int:
    return max(0, min(255, int(round(value))))


def _key_channels(key: Color) -> list[int]:
    strongest = max(key)
    if strongest < 128:
        return []
    return [index for index, value in enumerate(key) if value >= strongest - 16 and value >= 128]


def _key_dominance(rgb: Color, key: Color) -> float:
    channels = [float(channel) for channel in rgb]
    keyed = _key_channels(key)
    if not keyed:
        return 0.0
    other = [index for index in range(3) if index not in keyed]
    key_strength = min(channels[index] for index in keyed) if len(keyed) > 1 else channels[keyed[0]]
    other_strength = max((channels[index] for index in other), default=0.0)
    return key_strength - other_strength


def _sample_key(image, mode: str) -> Color:
    width, height = image.size
    pixels = image.load()
    samples: list[Color] = []

    if mode == "corners":
        patch = max(1, min(width, height, 12))
        boxes = [
            (0, 0, patch, patch),
            (width - patch, 0, width, patch),
            (0, height - patch, patch, height),
            (width - patch, height - patch, width, height),
        ]
        for left, top, right, bottom in boxes:
            for y in range(top, bottom):
                for x in range(left, right):
                    samples.append(pixels[x, y][:3])
    else:
        band = max(1, min(width, height, 6))
        step = max(1, min(width, height) // 256)
        for x in range(0, width, step):
            for y in range(band):
                samples.append(pixels[x, y][:3])
                samples.append(pixels[x, height - 1 - y][:3])
        for y in range(0, height, step):
            for x in range(band):
                samples.append(pixels[x, y][:3])
                samples.append(pixels[width - 1 - x, y][:3])

    return (
        int(round(median(sample[0] for sample in samples))),
        int(round(median(sample[1] for sample in samples))),
        int(round(median(sample[2] for sample in samples))),
    )


def _soft_alpha(distance: int, transparent_threshold: float, opaque_threshold: float) -> int:
    if distance <= transparent_threshold:
        return 0
    if distance >= opaque_threshold:
        return 255
    ratio = (distance - transparent_threshold) / max(1.0, opaque_threshold - transparent_threshold)
    return _clamp_byte(255.0 * _smoothstep(ratio))


def _despill(rgb: Color, key: Color, alpha: int) -> Color:
    if alpha >= 252:
        return rgb
    keyed = _key_channels(key)
    if not keyed:
        return rgb
    channels = [float(channel) for channel in rgb]
    other = [index for index in range(3) if index not in keyed]
    if not other:
        return rgb
    cap = max(0.0, max(channels[index] for index in other) - 1.0)
    for index in keyed:
        channels[index] = min(channels[index], cap)
    return (_clamp_byte(channels[0]), _clamp_byte(channels[1]), _clamp_byte(channels[2]))


def remove_key(
    input_path: Path,
    output_path: Path,
    key: Color,
    tolerance: int,
    soft_matte: bool,
    transparent_threshold: float,
    opaque_threshold: float,
    edge_contract: int,
    edge_feather: float,
    despill: bool,
) -> tuple[int, int, int, Color]:
    Image, ImageFilter = _load_pillow()
    image = Image.open(input_path).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    total = width * height
    transparent_before_filters = 0

    for y in range(height):
        for x in range(width):
            red, green, blue, source_alpha = pixels[x, y]
            rgb = (red, green, blue)
            distance = _distance(rgb, key)
            key_like = distance <= opaque_threshold or _key_dominance(rgb, key) >= 16

            if soft_matte and key_like:
                output_alpha = min(source_alpha, _soft_alpha(distance, transparent_threshold, opaque_threshold))
            else:
                output_alpha = 0 if distance <= tolerance else source_alpha

            if output_alpha <= 8:
                pixels[x, y] = (0, 0, 0, 0)
                transparent_before_filters += 1
                continue

            if despill and key_like:
                red, green, blue = _despill(rgb, key, output_alpha)
            pixels[x, y] = (red, green, blue, output_alpha)

    if edge_contract > 0:
        alpha = image.getchannel("A")
        for _ in range(edge_contract):
            alpha = alpha.filter(ImageFilter.MinFilter(3))
        image.putalpha(alpha)

    if edge_feather > 0:
        alpha = image.getchannel("A").filter(ImageFilter.GaussianBlur(radius=edge_feather))
        image.putalpha(alpha)

    alpha_values = list(image.getchannel("A").getdata())
    transparent_after = sum(1 for value in alpha_values if value == 0)
    partial_after = sum(1 for value in alpha_values if 0 < value < 255)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path)
    return total, transparent_after, partial_after, key


def main() -> None:
    parser = argparse.ArgumentParser(description="Remove a flat chroma-key background.")
    parser.add_argument("--input", required=True, type=Path, help="Input image with a flat key background.")
    parser.add_argument("--out", required=True, type=Path, help="Output .png or .webp file.")
    parser.add_argument("--key-color", default="#00ff00", help="Hex key color, for example #00ff00.")
    parser.add_argument("--auto-key", choices=["none", "corners", "border"], default="none", help="Sample key from corners or border.")
    parser.add_argument("--tolerance", type=int, default=12, help="Hard-key tolerance, 0-255.")
    parser.add_argument("--soft-matte", action="store_true", help="Use a smooth alpha ramp near the key color.")
    parser.add_argument("--transparent-threshold", type=float, default=12.0, help="Distance mapped to transparent.")
    parser.add_argument("--opaque-threshold", type=float, default=160.0, help="Distance mapped to opaque.")
    parser.add_argument("--edge-contract", type=int, default=0, help="Shrink visible matte by this many pixels.")
    parser.add_argument("--edge-feather", type=float, default=0.0, help="Blur alpha edge by this radius.")
    parser.add_argument("--despill", action="store_true", help="Reduce key-color spill on semi-transparent edges.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing output.")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Error: input not found: {args.input}", file=sys.stderr)
        raise SystemExit(1)
    if args.out.exists() and not args.force:
        print(f"Error: output already exists: {args.out} (use --force).", file=sys.stderr)
        raise SystemExit(1)
    if args.out.suffix.lower() not in {".png", ".webp"}:
        print("Error: --out must end in .png or .webp to preserve alpha.", file=sys.stderr)
        raise SystemExit(1)
    if args.transparent_threshold >= args.opaque_threshold and args.soft_matte:
        print("Error: --transparent-threshold must be lower than --opaque-threshold.", file=sys.stderr)
        raise SystemExit(1)

    Image, _ = _load_pillow()
    with Image.open(args.input).convert("RGBA") as sample:
        key = _sample_key(sample, args.auto_key) if args.auto_key != "none" else _parse_color(args.key_color)

    total, transparent, partial, key = remove_key(
        args.input,
        args.out,
        key,
        args.tolerance,
        args.soft_matte,
        args.transparent_threshold,
        args.opaque_threshold,
        args.edge_contract,
        args.edge_feather,
        args.despill,
    )
    print(f"Wrote {args.out}")
    print(f"Key color: #{key[0]:02x}{key[1]:02x}{key[2]:02x}")
    print(f"Transparent pixels: {transparent}/{total}")
    print(f"Partially transparent pixels: {partial}/{total}")


if __name__ == "__main__":
    main()
