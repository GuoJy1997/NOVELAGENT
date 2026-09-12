# Delivery

Use stable, role-first names. Keep source files only when they are useful for future reprocessing or required by the renderer.

## Recommended Naming

| Role | Pattern |
| --- | --- |
| Opaque background | `<surface>-bg-<subject>-<style>.png` |
| Main subject alpha | `<surface>-<subject>-foreground-alpha.png` |
| Prop or object alpha | `<surface>-<object>-prop-alpha.png` |
| Behind-subject glow | `<surface>-glow-halo-alpha.png` |
| Behind-subject cloud band | `<surface>-cloud-ribbon-alpha.png` |
| Foreground atmosphere | `<surface>-mist-foreground-alpha.png` |
| Particle overlay | `<surface>-particles-alpha.png` |
| Chroma source backup | `<surface>-<asset>-chroma-source.png` |
| Black source backup | `<surface>-<asset>-screen-source.png` |
| Composite preview | `<surface>-layered-composite-preview.png` |
| Package manifest | `<surface>-layers.json` |
| Style preview board | `<surface>-style-preview-board.png` |
| Selected concept reference | `<surface>-selected-concept-reference.png` |

Use lowercase, hyphen-separated names. Avoid spaces and platform-specific words unless the asset truly belongs only to that platform.

## Default Layer Order

1. Opaque background.
2. Far atmosphere or background particles.
3. Behind-subject glow, rim light, or cloud ribbon.
4. Main subject or object alpha PNG.
5. Foreground atmosphere, petals, dust, smoke, rain, or snow.
6. Bitmap UI ornaments.
7. Native UI labels, controls, and interactive elements.

## Manifest Fields

When packaging a layer set, create a small JSON manifest when useful:

```json
{
  "name": "home-celestial-garden",
  "canvas": {"width": 1440, "height": 3200},
  "layers": [
    {"role": "background", "path": "home-bg-celestial-garden.png", "opacity": 1},
    {"role": "midground-light", "path": "home-glow-halo-alpha.png", "opacity": 0.85},
    {"role": "foreground-subject", "path": "home-deity-foreground-alpha.png", "opacity": 1},
    {"role": "foreground-atmosphere", "path": "home-mist-foreground-alpha.png", "opacity": 0.6}
  ],
  "sources": [
    {"path": "home-glow-halo-screen-source.png", "usage": "source-only"}
  ]
}
```

## Alpha Policy

Production foreground layers should be transparent PNG or WebP by default.

Keep black-source images only when:

- The renderer intentionally uses `screen`, `plus-lighter`, additive, or equivalent blending.
- The source is needed for future alpha tuning.
- The final response clearly labels the image as source-only.

Keep chroma-key source images only when:

- The user may want to reprocess edges later.
- The extraction is not perfect and manual cleanup may be needed.
- The source is part of a reusable generation package.

## Validation Checklist

- Background dimensions match the intended canvas.
- Background is visually opaque and contains no accidental subject or text.
- Every production foreground layer has an alpha channel.
- Transparent pixels exist in every non-background production layer.
- Crisp subject alpha bounding boxes do not touch the canvas edge.
- Chroma-key outputs have no obvious green or magenta fringe.
- Black-source outputs have a corresponding alpha PNG.
- Composite preview uses the actual background and real production layers.
- Source-only assets are clearly labeled.
- Text-only workflows include the selected style direction or explicitly note that preview confirmation was waived.
