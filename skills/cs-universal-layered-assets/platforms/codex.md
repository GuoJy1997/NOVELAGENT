# Codex Adapter

Keep `SKILL.md` at the skill root with YAML frontmatter containing only `name` and `description`. Put optional UI metadata in `agents/openai.yaml`.

## Suggested Install

Place the folder under a Codex skills directory, for example:

```bash
cp -R universal-layered-assets "${CODEX_HOME:-$HOME/.codex}/skills/"
```

Then invoke it by name:

```text
Use $universal-layered-assets to create a layered mobile home screen asset package.
```

## Notes

- Keep `scripts/` bundled so the skill does not depend on system-only helper scripts.
- Keep references one level from `SKILL.md` so another agent can load only the needed detail.
- Do not place platform-specific metadata in the main frontmatter.
