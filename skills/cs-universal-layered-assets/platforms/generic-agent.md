# Generic Agent Adapter

This package is intentionally platform-neutral. Any agent can use it if it can read Markdown files and run local Python scripts.

## Minimal Contract

1. Read `SKILL.md` for the core workflow.
2. Read only the relevant file in `references/` when detail is needed.
3. Run scripts from `scripts/` for deterministic processing.
4. Return final paths, layer order, dimensions, and validation results.

## Runtime Requirements

- Python 3.9 or newer is recommended.
- Pillow is required for bundled image-processing scripts.

Install Pillow when needed:

```bash
python -m pip install pillow
```

## Portability Rule

Do not depend on hidden platform helpers for chroma-key removal, alpha extraction, or preview compositing. Use the bundled scripts so results can be reproduced across agents.
