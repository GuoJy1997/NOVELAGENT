# Size Guide

Use user-provided dimensions when available. When dimensions are unknown, choose a generous master size and export smaller variants from the master.

## Common Canvases

| Target | Recommended master | Aspect | Notes |
| --- | ---: | --- | --- |
| Mobile portrait app screen | 1440 x 3200 | 9:20 | Good universal portrait master with room for tall phones. |
| iPhone-style portrait hero | 1290 x 2796 | approx 9:19.5 | Useful when matching modern phone screenshots. |
| Tablet portrait | 2048 x 2732 | 3:4 | Keep subject and UI away from edges. |
| Desktop web hero | 2560 x 1440 | 16:9 | Leave responsive crop-safe margins on both sides. |
| Game landscape | 3840 x 2160 | 16:9 | Use 1920 x 1080 for lighter prototypes. |
| Square icon or object master | 2048 x 2048 | 1:1 | Export 1024, 512, 256, and 128 variants when needed. |
| Character portrait layer | 2048 x 3072 | 2:3 | Keep full body inside frame with padding unless bust-only is requested. |
| Sprite frame | 512 x 512, 1024 x 1024, or 2048 x 2048 | usually square | Keep consistent anchor, feet line, and scale across frames. |
| Wide banner | 3000 x 1000 | 3:1 | Keep key subject near center third for responsive crops. |
| Social square | 2048 x 2048 | 1:1 | Keep text native or in a separate editable layer. |

## Layer Size Rules

- Background layers should match the final canvas exactly.
- Atmosphere and light layers should usually match the canvas so animation can use opacity and offsets without rescaling.
- Character and prop layers may be smaller than the canvas, but must include enough transparent padding to prevent clipped edges during animation.
- Sprite frames in one animation set must share the same canvas size and anchor point.
- UI ornaments should be generated at 2x or 3x the display size when raster texture is needed.

## Safe Areas

Reserve empty or low-detail space where native UI will live:

- Top navigation or status area: keep important faces and symbols below the top 12-16 percent.
- Bottom action area: keep buttons native and avoid high-contrast detail in the bottom 18-24 percent.
- Responsive web hero: keep critical subject matter within the center 60 percent width.
- Mobile portrait: assume top and bottom crops may vary; do not place critical content at the extreme edge.

## Export Policy

Keep a high-resolution master package and export app-specific sizes from it. Avoid upscaling production layers after alpha extraction because edge artifacts become more visible.
