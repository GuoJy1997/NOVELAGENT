# Claude Adapter

Use this folder as a portable skill package. Preserve the same root structure:

```text
SKILL.md
references/
scripts/
platforms/
manifest.json
```

## Suggested Setup

- Use the `SKILL.md` body as the main instruction file.
- Include `references/` as supporting knowledge files.
- Include `scripts/` as local tools that can be run with Python.
- Ensure the runtime has Pillow installed before running image-processing scripts.

## Invocation Pattern

```text
Use the universal-layered-assets skill to generate and package layered image assets for this app/game scene.
```

## Notes

- If the host platform has its own manifest or metadata format, map `manifest.json` fields to that format instead of changing `SKILL.md`.
- Keep platform-specific setup instructions outside `SKILL.md`.
