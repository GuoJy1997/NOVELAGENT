---
name: universal-layered-assets
description: Generate, process, validate, and package layered visual assets for apps, games, websites, motion UI, and AI image workflows from text descriptions or reference images. Use when Codex needs style preview boards, user-selected visual directions, reusable image layers such as opaque backgrounds, transparent foreground characters or objects, sprites, props, cloud/mist/smoke overlays, particles, glow/light maps, UI ornaments, tileable textures, chroma-key extractions, black-background-to-alpha conversion, composite previews, or portable skill packages for other agent platforms.
---

# Universal Layered Assets

## Core Rule

Treat generated visuals as compositing inputs, not as one flat illustration. Start from a text description or reference image, lock the visual direction, then deliver one opaque base image plus alpha PNG layers for foreground subjects, atmosphere, particles, ornaments, and lights unless the target renderer explicitly needs a black-source blend map.

Black-background glow, cloud, mist, or particle images are source assets. Convert them to alpha PNG for normal app use, or label them as source-only and document the required blend mode.

## Workflow

1. Ingest the request:
   - Text-only request: create one style preview board with multiple labeled directions before generating production layers.
   - Reference-image request: analyze the reference for subject, style, palette, lighting, composition, and separable layers before generating production layers.
   - Mixed request: use the text as intent and the reference image as visual constraint; ask for confirmation only when they conflict.

2. Define the asset target before generating:
   - Target surface: mobile app, desktop web, game screen, sprite, icon, social image, presentation, or motion overlay.
   - Canvas size and aspect ratio.
   - Layer stack and intended order.
   - Whether each layer should be opaque, transparent PNG, chroma-key source, or black-source overlay.

3. Lock the visual direction:
   - Read `references/generation-workflow.md` for text input, reference-image input, preview boards, user confirmation, and layer-generation sequencing.
   - For text-only work, do not proceed to final layer generation until the user chooses a preview direction, unless the user explicitly waived confirmation.
   - Use `scripts/make_contact_sheet.py` when the image tool creates separate preview candidates instead of one combined board.

4. Choose asset types:
   - Read `references/asset-types.md` when deciding layer categories or generation strategy.
   - Read `references/size-guide.md` when the user did not provide exact dimensions.

5. Generate production layers:
   - Opaque backgrounds: environment only, no characters, text, UI, silhouettes, watermark, or baked buttons.
   - Crisp subjects and props: choose a chroma-key color that is absent from the subject, generate on that flat key, then run `scripts/remove_chroma_key.py`.
   - Soft light, cloud, mist, smoke, and particles: generate on pure black, then run `scripts/black_to_alpha.py`.
   - UI text and controls: keep native in the app whenever possible; only bitmap texture, symbol, or ornament layers belong in the image package.

6. Process and validate:
   - Use `scripts/inspect_alpha.py` to confirm non-background layers are RGBA and contain useful transparent pixels.
   - Use `scripts/make_composite_preview.py` to verify real stacking over the background.
   - Inspect obvious fringes, unwanted shadows, clipped edges, and accidental subject silhouettes.

7. Package deliverables:
   - Read `references/delivery.md` for stable naming, manifest contents, source retention, and layer order.
   - Read `platforms/codex.md`, `platforms/claude.md`, or `platforms/generic-agent.md` only when preparing the skill bundle for a specific agent platform.

## Default Layer Stack

Use this order unless the user or renderer requires another stack:

1. `background`: opaque full-canvas image.
2. `midground-light`: halo, glow, cloud ribbon, rim light, or particles behind the subject.
3. `foreground-subject`: character, object, prop, logo mark, or sprite frame as transparent PNG.
4. `foreground-atmosphere`: mist, smoke, cloud, petals, sparks, dust, rain, snow, or depth haze.
5. `ui-ornament`: decorative bitmap texture, divider, nameplate, frame, or mark.
6. Native UI: live text, buttons, hit targets, accessibility labels, and app controls.

## Script Quick Start

Chroma-key extraction:

```bash
python scripts/remove_chroma_key.py \
  --input subject-chroma-source.png \
  --out subject-alpha.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 160 \
  --despill
```

Black-source overlay extraction:

```bash
python scripts/black_to_alpha.py \
  --input glow-screen-source.png \
  --out glow-alpha.png \
  --black-point 3 \
  --white-point 220 \
  --gamma 0.82
```

Alpha inspection:

```bash
python scripts/inspect_alpha.py subject-alpha.png
```

Foreground subject padding check:

```bash
python scripts/inspect_alpha.py subject-alpha.png \
  --require-alpha \
  --min-transparent-ratio 0.05 \
  --min-edge-margin 24
```

Composite preview:

```bash
python scripts/make_composite_preview.py \
  --background home-bg.png \
  --layer glow-alpha.png \
  --layer subject-alpha.png@center \
  --layer mist-alpha.png \
  --out home-layered-composite-preview.png
```

Preview contact sheet from separate candidates:

```bash
python scripts/make_contact_sheet.py \
  --input style-a.png \
  --input style-b.png \
  --input style-c.png \
  --input style-d.png \
  --out style-preview-board.png
```

## Quality Bar

A layered asset package is not done until:

- Text-only requests have a style preview board and a selected direction, unless confirmation was explicitly waived.
- Reference-image requests have an explicit layer strategy derived from the reference.
- The background is opaque and contains no accidental subject, UI, text, or watermark.
- Every non-background production layer is an alpha-capable PNG or WebP.
- Crisp foreground subjects have transparent padding and their alpha bounding box does not touch the canvas edge.
- Chroma-key outputs have no visible green or magenta edge at normal display size.
- Every black-source image has a production alpha PNG equivalent, unless explicitly source-only.
- The composite preview proves the intended layer order works.
- The final response lists saved paths, layer order, dimensions, and any source-only assets.
