# 2026-08-migrate-to-vercel-labs-skills-ecosystem

> **Status:** Accepted
> **Issues:** [#192 — Adopt vercel-labs/skills for skill installation](https://github.com/HeadlessTarry/Token-Effort/issues/192), [#199 — Migrate Token-Effort from Superpowers to Matt Pocock skills ecosystem](https://github.com/HeadlessTarry/Token-Effort/issues/199)
> **Date:** 2026-08-08
> **Supersedes:** [2026-07-vendor-dependency-install-system.md](./2026-07-vendor-dependency-install-system.md)

## Context

Token-Effort relied on two pieces of custom infrastructure:

1. **Obra's Superpowers plugin** — bundled via `vendor.json` and registered in `opencode.json` as a plugin dependency. Superpowers provided the skill framework and several bundled skills.
2. **Custom install system** — `install.sh`/`install.ps1` with `vendor.json` manifest, `lib/` helpers, and `.vendor/` directory for shallow-cloned repos.

This setup had several problems:

- **Maintenance burden** — two platform-specific codebases (bash + PowerShell) maintained in parallel
- **CI incompatibility** — `install.sh` ran vendor processing unconditionally (even with `--skill` flag), hitting interactive `read -rp` prompts that fail in CI with no stdin
- **Ecosystem shift** — the broader AI coding assistant ecosystem was converging on [vercel-labs/skills](https://github.com/vercel-labs/skills) as a standard for skill distribution and installation

## Decision

**Migrate to the vercel-labs/skills ecosystem.** Token-Effort now uses `npx skills add HeadlessTarry/Token-Effort` as its installation method, with skills in the standard `skills/<name>/SKILL.md` format.

### What was removed

- `install.sh`, `install.ps1`, `vendor.json`, `lib/` directory
- Superpowers plugin dependency and `vendor.json` configuration
- `.github/workflows/triaging-gh-issue.yml` (triage skill now provided externally)
- Seven Superpowers-dependent skills (brainstorming-gh-issue, building-gh-issue, computing-branch-diff, move-issue-status, recording-decisions, reviewing-code-systematically, triaging-gh-issue)
- Four reviewer agents (reviewer-dead-code, reviewer-docs, reviewer-newcomer, reviewer-test-quality)
- All training evals for removed skills

### What was retained

- Four standalone skills: `repo-setup`, `propose-feature`, `report-bug`, `configuring-dependabot`
- Two project-local skills: `agent-skill-crafter`, `run-training` (in `.opencode/skills/`)
- All ADRs (historical record)

### What changed

- **Installation**: `git clone` + `./install.sh` → `npx skills add HeadlessTarry/Token-Effort`
- **Skill format**: Superpowers-specific → standard `SKILL.md` with YAML frontmatter (`name`, `description`)
- **Triage**: Bundled triaging-gh-issue skill → external `/triage` skill from Matt Pocock's ecosystem
- **Updates**: `install.sh --update` → `npx skills update`

## Consequences

- **Positive:** Single-command installation with no shell scripts or platform-specific code
- **Positive:** CI-compatible — no interactive prompts, no stdin requirements
- **Positive:** Cross-platform — works with OpenCode, Claude Code, Cursor, Codex, and other vercel-labs/skills-compatible agents
- **Positive:** Reduced maintenance — no custom install infrastructure to maintain
- **Trade-off:** Loss of vendor dependency management — third-party dependencies are no longer declaratively managed. Users install them separately if needed.
- **Trade-off:** Triage skill is no longer bundled — users must install it from Matt Pocock's ecosystem separately.
- **Trade-off:** `user-invocable` frontmatter field removed — it was Claude Code-only and not part of the Agent Skills spec. Platform-specific config should go in `agents/<platform>.yaml` files if needed.
