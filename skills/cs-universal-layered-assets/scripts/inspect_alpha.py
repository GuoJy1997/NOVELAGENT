#!/usr/bin/env python3
"""Inspect image mode, dimensions, and alpha coverage for layered asset validation."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Optional


def _load_image():
    try:
        from PIL import Image
    except ImportError:
        print("Error: Pillow is required. Install it with `python -m pip install pillow`.", file=sys.stderr)
        raise SystemExit(1)
    return Image


def inspect(path: Path) -> dict[str, object]:
    Image = _load_image()
    with Image.open(path) as image:
        mode = image.mode
        width, height = image.size
        has_alpha = mode in {"RGBA", "LA"} or ("transparency" in image.info)
        rgba = image.convert("RGBA")
        alpha = rgba.getchannel("A")
        alpha_values = list(alpha.getdata())
        total = len(alpha_values)
        transparent = sum(1 for value in alpha_values if value == 0)
        partial = sum(1 for value in alpha_values if 0 < value < 255)
        opaque = total - transparent - partial
        bbox = alpha.getbbox()

    return {
        "path": str(path),
        "mode": mode,
        "width": width,
        "height": height,
        "hasAlpha": has_alpha,
        "totalPixels": total,
        "transparentPixels": transparent,
        "partialAlphaPixels": partial,
        "opaquePixels": opaque,
        "transparentRatio": round(transparent / total, 6) if total else 0,
        "partialAlphaRatio": round(partial / total, 6) if total else 0,
        "alphaBoundingBox": list(bbox) if bbox else None,
    }


def _validate_result(
    result: dict[str, object],
    *,
    require_alpha: bool,
    min_transparent_ratio: Optional[float],
    min_edge_margin: Optional[int],
) -> list[str]:
    errors = []
    path = str(result["path"])

    if require_alpha and not result["hasAlpha"]:
        errors.append(f"{path}: expected an alpha-capable image.")

    if min_transparent_ratio is not None and float(result["transparentRatio"]) < min_transparent_ratio:
        errors.append(
            f"{path}: transparent ratio {result['transparentRatio']} is below {min_transparent_ratio}."
        )

    if min_edge_margin is not None:
        bbox = result["alphaBoundingBox"]
        if bbox is None:
            errors.append(f"{path}: alpha bounding box is empty.")
        else:
            left, top, right, bottom = bbox
            width = int(result["width"])
            height = int(result["height"])
            margins = {
                "left": left,
                "top": top,
                "right": width - right,
                "bottom": height - bottom,
            }
            failing = {side: value for side, value in margins.items() if value < min_edge_margin}
            if failing:
                details = ", ".join(f"{side}={value}" for side, value in failing.items())
                errors.append(f"{path}: alpha touches padding guard ({details}, required {min_edge_margin}px).")

    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect alpha coverage for one or more images.")
    parser.add_argument("images", nargs="+", type=Path)
    parser.add_argument("--require-alpha", action="store_true", help="Fail if an image has no alpha support.")
    parser.add_argument(
        "--min-transparent-ratio",
        type=float,
        default=None,
        help="Fail if transparent pixel ratio is below this value, for example 0.05.",
    )
    parser.add_argument(
        "--min-edge-margin",
        type=int,
        default=None,
        help="Fail if the alpha bounding box is closer than this many pixels to any canvas edge.",
    )
    args = parser.parse_args()

    results = []
    errors = []
    for image_path in args.images:
        if not image_path.exists():
            print(f"Error: image not found: {image_path}", file=sys.stderr)
            raise SystemExit(1)
        result = inspect(image_path)
        results.append(result)
        errors.extend(
            _validate_result(
                result,
                require_alpha=args.require_alpha,
                min_transparent_ratio=args.min_transparent_ratio,
                min_edge_margin=args.min_edge_margin,
            )
        )

    print(json.dumps(results[0] if len(results) == 1 else results, indent=2))
    if errors:
        for error in errors:
            print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
