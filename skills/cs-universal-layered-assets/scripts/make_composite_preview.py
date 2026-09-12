#!/usr/bin/env python3
"""Composite layered assets over a background for quick visual validation."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
import sys
from typing import Optional


@dataclass
class LayerSpec:
    path: Path
    x: Optional[int] = None
    y: Optional[int] = None
    scale: float = 1.0
    opacity: float = 1.0
    center: bool = False


def _load_image():
    try:
        from PIL import Image
    except ImportError:
        print("Error: Pillow is required. Install it with `python -m pip install pillow`.", file=sys.stderr)
        raise SystemExit(1)
    return Image


def _parse_layer(raw: str) -> LayerSpec:
    if "@" not in raw:
        return LayerSpec(path=Path(raw))

    path_raw, placement_raw = raw.rsplit("@", 1)
    path = Path(path_raw)
    placement = placement_raw.strip().lower()

    if placement == "center":
        return LayerSpec(path=path, center=True)

    parts = [part.strip() for part in placement.split(",")]
    if len(parts) not in {2, 4}:
        raise ValueError("layer placement must be PATH, PATH@center, PATH@x,y, or PATH@x,y,scale,opacity")

    x = int(parts[0])
    y = int(parts[1])
    scale = float(parts[2]) if len(parts) == 4 else 1.0
    opacity = float(parts[3]) if len(parts) == 4 else 1.0
    return LayerSpec(path=path, x=x, y=y, scale=scale, opacity=opacity)


def _apply_opacity(image, opacity: float):
    opacity = max(0.0, min(1.0, opacity))
    if opacity >= 1.0:
        return image
    alpha = image.getchannel("A")
    alpha = alpha.point(lambda value: int(round(value * opacity)))
    image.putalpha(alpha)
    return image


def _resampling_lanczos(Image):
    return getattr(getattr(Image, "Resampling", Image), "LANCZOS")


def composite(background_path: Path, layer_specs: list[LayerSpec], output_path: Path) -> None:
    Image = _load_image()
    base = Image.open(background_path).convert("RGBA")
    canvas_width, canvas_height = base.size

    for spec in layer_specs:
        if not spec.path.exists():
            print(f"Error: layer not found: {spec.path}", file=sys.stderr)
            raise SystemExit(1)

        layer = Image.open(spec.path).convert("RGBA")
        if spec.scale <= 0:
            print(f"Error: layer scale must be positive for {spec.path}", file=sys.stderr)
            raise SystemExit(1)

        if spec.scale != 1.0:
            next_size = (
                max(1, int(round(layer.width * spec.scale))),
                max(1, int(round(layer.height * spec.scale))),
            )
            layer = layer.resize(next_size, _resampling_lanczos(Image))

        layer = _apply_opacity(layer, spec.opacity)

        if spec.center or spec.x is None or spec.y is None:
            x = (canvas_width - layer.width) // 2
            y = (canvas_height - layer.height) // 2
        else:
            x = spec.x
            y = spec.y

        base.alpha_composite(layer, (x, y))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(output_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a composite preview from a background and ordered layers.")
    parser.add_argument("--background", required=True, type=Path, help="Opaque background image.")
    parser.add_argument("--layer", action="append", default=[], help="Layer spec: PATH, PATH@center, PATH@x,y, or PATH@x,y,scale,opacity.")
    parser.add_argument("--out", required=True, type=Path, help="Output preview image.")
    args = parser.parse_args()

    if not args.background.exists():
        print(f"Error: background not found: {args.background}", file=sys.stderr)
        raise SystemExit(1)
    if not args.layer:
        print("Error: provide at least one --layer.", file=sys.stderr)
        raise SystemExit(1)

    try:
        layers = [_parse_layer(raw) for raw in args.layer]
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)

    composite(args.background, layers, args.out)
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
