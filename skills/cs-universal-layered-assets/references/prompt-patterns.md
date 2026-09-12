# Prompt Patterns

Use these blocks as constraints inside the actual generation prompt. Add the user's subject, style, camera, and palette before the constraint block.

## Style Preview Board

Use this before production generation for text-only requests:

```text
Create one contact-sheet preview image with N labeled style directions for a layered app/game asset. Each tile must show the same subject and scene concept, but vary visual style, palette, lighting, material language, and atmosphere. Label tiles A, B, C, D, etc. This is for choosing a direction only, not production assets. No UI text, buttons, watermark, or final layer exports.
```

## Full Concept

Use a full concept only to settle direction:

```text
Create a complete visual concept for a layered app/game scene. Establish palette, lighting, subject scale, atmosphere, material language, and composition. This is a concept reference only; do not include text, buttons, watermarks, or UI labels.
```

## Opaque Background

```text
Generate only the environment background. No people, characters, creatures, foreground objects, silhouettes, UI, text, symbols, logos, buttons, or watermark. Keep the image full-canvas, opaque, and richly finished. Reserve clean negative space for foreground layers and native UI.
```

## Chroma-Key Foreground

Choose a key color that does not appear in the subject, edge glow, translucent areas, or props. Use green only when green is safe:

```text
The image must be on a perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no gradients, shadows, texture, floor, reflection, vignette, or glow spill. Do not use #00ff00 anywhere in the subject. No cast shadow and no contact shadow. Keep the subject fully inside the frame with clean edges and generous padding.
The subject should occupy no more than 70-80 percent of the canvas height or width, with clear key-color padding on all sides so antlers, hair, fabric, tails, and glow edges do not touch the frame.
```

Use magenta when the subject contains green:

```text
The image must be on a perfectly flat solid #ff00ff chroma-key background for background removal. The background must be one uniform color with no gradients, shadows, texture, floor, reflection, vignette, or glow spill. Do not use #ff00ff anywhere in the subject. No cast shadow and no contact shadow. Keep the subject fully inside the frame with clean edges and generous padding.
The subject should occupy no more than 70-80 percent of the canvas height or width, with clear key-color padding on all sides so antlers, hair, fabric, tails, and glow edges do not touch the frame.
```

Use blue or yellow when both green and magenta conflict:

```text
The image must be on a perfectly flat solid <KEY_COLOR> chroma-key background for background removal. The background must be one uniform color with no gradients, shadows, texture, floor, reflection, vignette, or glow spill. Do not use <KEY_COLOR> anywhere in the subject. No cast shadow and no contact shadow. Keep the subject fully inside the frame with clean edges and generous padding.
The subject should occupy no more than 70-80 percent of the canvas height or width, with clear key-color padding on all sides so antlers, hair, fabric, tails, and glow edges do not touch the frame.
```

## Black-Source Atmosphere Or Light

```text
Use a perfectly pure black background for later alpha extraction or screen/additive blending. The background must contain no texture, gradient, vignette, frame, or UI. Keep the light, cloud, mist, smoke, or particle form isolated enough to convert black to transparency cleanly.
```

## Direct Transparent Layer

Use only when the tool supports true alpha output:

```text
Output a transparent-background PNG with a real alpha channel. No checkerboard pattern, no flat colored background, no shadow floor, no border, no frame, no text, and no watermark. Keep the subject fully inside the canvas with transparent padding.
```

## Sprite Set

```text
Create a consistent sprite frame with the same camera angle, scale, lighting, style, ground contact point, and padding as the other frames in the set. No background, no text, no UI, no shadow unless the shadow is requested as a separate layer.
```

## Tileable Texture

```text
Create a seamless tileable texture. Avoid directional lighting, unique landmarks, text, borders, frames, and non-repeating features. The left edge must connect naturally to the right edge, and the top edge must connect naturally to the bottom edge.
```

## UI Ornament

```text
Create only the decorative ornament or texture element. No live text, no readable labels, no buttons, no app UI mockup, no watermark. Keep it isolated for use as a transparent asset or vector reference.
```
