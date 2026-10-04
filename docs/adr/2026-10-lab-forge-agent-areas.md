# 2026-10-lab-forge-agent-areas

> **Status:** Accepted
> **Date:** 2026-10-04
> **Supersedes:** [2026-08-migrate-to-vercel-labs-skills-ecosystem.md](./2026-08-migrate-to-vercel-labs-skills-ecosystem.md) (installation method and retained-skills list)

## Context

Token-Effort was a set of skills installed globally with `npx skills add`, alongside other skill sets. Several agent sessions could not run in parallel without sharing, and leaking, every installed skill.

## Decision

Two isolated areas, **Lab** (explore and plan, outputs issues, uses `mattpocock/skills`) and **Forge** (issues to PRs, uses `michael-denyer/pstack-claude`).

- **Isolation by `CLAUDE_CONFIG_DIR`** (`~/.claude-lab`, `~/.claude-forge`), with shell commands `claude-lab` and `claude-forge`. Nothing is installed at repo scope and the default `~/.claude` is untouched.
  - This mechanism is specific to Claude Code. Other platforms need their own equivalent, and none is built yet. The planned one for OpenCode is a per-area `XDG_CONFIG_HOME` redirect, with one primary agent per area that allows only that area's skills via `permission.skill`. Until a platform has its own install step, areas are not isolated there.
- **Native install per platform.** Claude Code plugins go in with `claude plugin install`; home-grown skills go in with `npx skills add --copy`, with `XDG_STATE_HOME` set per area so the areas don't share a lock file. Plugin auto-update is on via `extraKnownMarketplaces.<name>.autoUpdate`.
- **Personas are plugins** (`personas/<id>/`), one per area, chosen at install. An output style with `force-for-plugin: true` plus a shell-only `UserPromptSubmit` reminder hook. Uninstalling means Default.
- **One `install.sh`** for setup and updates. It never runs slash commands; it prints next steps instead.
- Every skill from each plugin is installed; no exclusion lists.

## Consequences

- Known limitation: isolation currently works on Claude Code only (see above).
- Lab also receives mattpocock's execution skills, accepted.
- Zed sessions may not trigger plugin auto-update; re-running `install.sh` is the fallback.
- The training-eval system, `run-training`, `agent-skill-crafter` and `repo-setup` are replaced by `writing-for-agents` and pstack's `eval` playbook.
- Adding a platform (OpenCode next) means a new install step in `install.sh`.
