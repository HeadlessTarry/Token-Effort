# 0004-portable-skill-frontmatter

> **Status:** Accepted
> **Date:** 2026-10-06

## Context

Token-Effort currently targets Claude Code, but its skills should work on any [Agent Skills](https://agentskills.io/specification)-compatible platform (e.g. OpenCode). The spec allows only `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools` in `SKILL.md` frontmatter. Other fields are ignored by some platforms (OpenCode ignores unknown fields) and rejected by the spec's `skills-ref validate`.

The earlier rule to avoid platform-specific fields lived in [0001-migrate-to-vercel-labs-skills-ecosystem.md](./0001-migrate-to-vercel-labs-skills-ecosystem.md), which is now superseded. Neither successor restated it, and `disclose-ai-content` regained the Claude Code-only `user-invocable` field.

## Decision

`SKILL.md` frontmatter uses only Agent Skills spec fields. Platform-specific fields (e.g. `user-invocable`, `disable-model-invocation`) are not used.

## Consequences

- No automated check enforces this yet (neither `run_checks.sh` nor CI). Compliance relies on review. Adding `skills-ref validate` is a possible follow-up.
- `disclose-ai-content` no longer sets `user-invocable: false`, so it appears in Claude Code's `/` menu. It still auto-activates.
