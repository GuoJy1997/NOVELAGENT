# Asset Types

Use this reference to choose how each visual element should be generated, processed, and delivered.

## Type Matrix

| Asset type | Best source strategy | Production output | Notes |
| --- | --- | --- | --- |
| Full background | Generate opaque environment only | RGB/RGBA PNG or JPG | No people, UI, text, silhouettes, or watermarks. Leave safe space for foreground and native UI. |
| Character or hero subject | Flat chroma-key source | Transparent PNG/WebP | Choose a key color absent from the subject. Avoid cast shadows and glow spill. |
| Prop or object | Flat chroma-key source | Transparent PNG/WebP | Keep full object inside frame with padding. Use separate layers for shadow or glow. |
| Sprite frame | Chroma-key source or direct transparent source | Transparent PNG/WebP | Keep consistent camera, scale, anchor point, and padding across frames. |
| Cloud, mist, smoke | Pure black source | Transparent PNG/WebP | Convert black to alpha before app use. Keep forms isolated and avoid textured black backgrounds. |
| Glow, halo, light beam | Pure black source | Transparent PNG/WebP or source-only blend map | Alpha PNG is safest. Source-only images require screen/additive blending. |
| Particles, sparks, dust, petals | Pure black source for light particles; chroma/direct transparent for opaque pieces | Transparent PNG/WebP | Split foreground and background particle fields if they animate differently. |
| UI ornament | Vector/code first; bitmap only for texture | SVG, code, or transparent PNG | Do not bake live labels or buttons into decorative assets. |
| Tileable texture | Seamless generation prompt | PNG/JPG texture | Validate tiling; keep lighting neutral unless it is a stylized surface. |
| Icon or app mark | Vector first; high-res bitmap fallback | SVG or transparent PNG | Produce square master at high resolution and export smaller sizes from it. |
| Social or marketing composite | Layered source plus final flat export | Layer folder plus final image | Keep editable layers for reuse even when a flat final is requested. |

## Source Strategy

Use an opaque background when the layer should fill the whole canvas and never require transparency.

Use chroma key when the subject has crisp boundaries: people, creatures, products, props, icons, and ornamental marks. The key color must be flat, untextured, unlit, and absent from the subject.

Use black source when the element is luminous or soft: glow, mist, smoke, cloud wisps, light rays, magical particles, sparks, haze, and bloom. Convert to alpha unless the final renderer intentionally uses a blend mode.

Use direct transparent generation only when the image model or editor reliably outputs real alpha and the result passes inspection. Still run `inspect_alpha.py`; many viewers display transparency in misleading ways.

## Split Decisions

Split an element into its own layer when:

- It will animate independently.
- It may need opacity, blur, blend mode, or color adjustments in the app.
- It could cover UI or the subject if baked into another layer.
- It will be reused across screens, skins, poses, or states.

Keep elements together when they are visually inseparable and will never move independently, such as painted background architecture or terrain.

## Chroma-Key Color Selection

Choose the key color after inspecting the subject palette. The best key is the color least likely to appear in the subject, edge glow, transparent fabric, hair, glass, or props.

| Avoid in subject | Prefer key |
| --- | --- |
| No strong green | `#00ff00` green |
| Green plants, jade, green clothing, emerald light | `#ff00ff` magenta |
| Magenta, pink, purple aura, red-violet clothing | `#00ff00` green or `#0066ff` blue |
| Blue clothing, water, ice, sky, blue glow | `#ff00ff` magenta or `#00ff00` green |
| Both green and magenta appear | `#0066ff` blue or `#ffff00` yellow |
| Highly colorful subject | Pick the rarest saturated color and verify with a small extraction test |

Always require a perfectly flat key background. Do not allow shadows, floor contact, gradients, glow spill, texture, or reflections on the key background.
