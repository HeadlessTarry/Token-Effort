# 0004-portable-skill-frontmatter

> **Status:** Accepted
> **Date:** 2026-10-06

## Context

Token-Effort currently targets Claude Code, but its skills should work on any [Agent Skills](https://agentskills.io/specification)-compatible platform (e.g. OpenCode). The spec allows only `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools` in `SKILL.md` frontmatter. Other fields are ignored by some platforms (OpenCode ignores unknown fields) and rejected by the spec's `skills-ref validate`.

The earlier rule to avoid platform-specific fields lived in [0001-migrate-to-vercel-labs-skills-ecosystem.md](./0001-migrate-to-vercel-labs-skills-ecosystem.md), which is now superseded. Neither successor restated it, and `disclose-ai-content` regained the Claude Code-only `user-invocable` field.

## Decision

`SKILL.md` frontmatter uses only **Skill frontmatter fields** (see [GLOSSARY.md](../../GLOSSARY.md)). **Platform-specific frontmatter fields** (e.g. `user-invocable`, `disable-model-invocation`) are not used.

A pre-commit hook runs [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref) 0.1.1 (the PyPI wheel, never built from source) on every skill's `SKILL.md`, in `run_checks.sh` and CI. It applies all of the spec's rules, so the check follows the spec as `skills-ref` evolves.

## Consequences

- `skills-ref` 0.1.1 enforces the rule (see [docs/running-checks.md](../running-checks.md)).
- Risk: `skills-ref` is alpha (`Development Status :: 3 - Alpha`), its README says "demonstration purposes only", and it has had no release since 2026-01-10. Revisit if abandoned.
- The pin needs a manual update: Dependabot's `pre-commit` ecosystem skips `repo: local` hooks (see the [changelog](https://github.blog/changelog/2026-03-10-dependabot-now-supports-pre-commit-hooks/)).
- Platform scope: any platform that reads Agent Skills; the hook checks only `SKILL.md` files under `skills/`.
- `disclose-ai-content` no longer sets `user-invocable: false`, so it appears in Claude Code's `/` menu. It still auto-activates.
