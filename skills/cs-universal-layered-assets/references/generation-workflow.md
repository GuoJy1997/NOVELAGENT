# Generation Workflow

Use this reference when creating layered assets from text prompts, reference images, or both.

## Text-Only Requests

For text-only requests, treat style selection as a required gate before production layers.

1. Convert the user request into a concise creative brief:
   - Subject and scene.
   - Target surface and aspect ratio.
   - Required layers.
   - Mood, palette, lighting, and motion needs.
   - Things that must remain native UI instead of baked image content.

2. Generate one preview board containing multiple style directions:
   - Default to 4 options when the user did not specify `N`.
   - Use 2-8 options depending on complexity and available generation budget.
   - Label options clearly as A, B, C, D, and so on.
   - Keep each option as a complete concept thumbnail, not production layers.
   - Use the same subject, composition intent, and aspect ratio across options.
   - Vary style, palette, lighting, material language, and atmosphere.

3. Stop and ask the user to choose an option before generating final layers.
   - If the platform cannot pause, return the preview board and a short selection prompt.
   - Do not generate production backgrounds, chroma-key subjects, or alpha overlays before the style is selected.

4. After selection, analyze the chosen preview:
   - Identify background-only content.
   - Identify foreground subject or props.
   - Identify behind-subject light, glow, or atmosphere.
   - Identify foreground atmosphere or particles.
   - Decide which UI elements must remain native.
   - Select the chroma-key color for each crisp subject.

5. Generate each layer separately using the selected preview as the style reference.

## Reference-Image Requests

For reference-image requests, analyze before generating:

- Subject identity and silhouette.
- Composition and camera angle.
- Palette and lighting.
- Surface texture and rendering style.
- Separable background, midground, foreground, atmosphere, and ornament layers.
- Risk areas: hair, translucent fabric, glass, water, glow spill, similar colors to possible key backgrounds.

If the user asks to preserve the reference direction, skip the multi-style board and produce a layer strategy first. If the reference is only loose inspiration or the style is ambiguous, create a smaller preview board with 2-4 variations based on the reference.

## Mixed Text And Reference

Use text as the user's intent and the image as visual evidence.

- If they align, continue with a layer strategy.
- If they conflict, ask which should dominate before final generation.
- If only small details conflict, make a conservative assumption and state it.

## Preview Board Prompt

```text
Create one contact-sheet preview image with N labeled style directions for a layered app/game asset. Each tile must show the same subject and scene concept, but vary visual style, palette, lighting, material language, and atmosphere. Label tiles A, B, C, D, etc. This is for choosing a direction only, not production assets. No UI text, buttons, watermark, or final layer exports.
```

## Chosen-Preview Analysis Output

Before production generation, write a compact layer plan:

```text
Selected direction: <A/B/C/...>
Canvas: <width>x<height>
Layer order:
1. background - opaque - <description>
2. midground-light - black source to alpha - <description>
3. foreground-subject - chroma key <color> to alpha - <description and why this key color is safe>
4. foreground-atmosphere - black source to alpha - <description>
5. ui-ornament - vector/code or transparent bitmap - <description>
Native UI: <text/buttons/controls to keep out of images>
```

## Production Generation Rules

- Use the chosen preview as style reference, not as a flat final image.
- Generate the background without the foreground subject.
- Generate each crisp subject on a flat key color that does not appear in the subject.
- Generate soft lights and atmosphere on pure black source, then convert to alpha.
- Generate separate layers for anything that should animate independently.
- Keep native text, buttons, and hit targets out of image layers.

## Production Validation And Retry

After chroma-key extraction, inspect the alpha result before accepting it:

```bash
python scripts/inspect_alpha.py <subject-alpha.png> \
  --require-alpha \
  --min-transparent-ratio 0.05 \
  --min-edge-margin 24
```

If the alpha bounding box touches or nearly touches the canvas edge, do not accept the layer as final. First try a tighter matte with `--edge-contract 1` and a small `--edge-feather` only when the subject is not visibly clipped. If the subject itself is too large or clipped, regenerate the source with a smaller subject and stronger padding instructions.
