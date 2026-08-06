# 2026-07-model-version-resilience

> **Status:** Active
> **Issue:** [#178 — Hardcoded OpenCode model versions cause 'Model not found' errors when versions are retired](https://github.com/HeadlessTarry/Token-Effort/issues/178)
> **Date:** 2026-07-04

## Context

Multiple agents, skills, and workflows in this repo pinned specific OpenCode model versions (e.g. `opencode-go/qwen3.5-plus`, `opencode-go/qwen3.6-plus`). When those versions were retired or unavailable to a user's account, invoking the affected agent/skill/workflow failed with "Model not found" errors. OpenCode has no built-in model aliasing — model IDs are always version-specific.

## Decision

Two-part approach:

1. **Subagent agent files:** Remove the `model:` field from YAML frontmatter in `agents/reviewer-newcomer.md`, `agents/reviewer-docs.md`, and `agents/reviewer-dead-code.md`. Subagents without a `model:` field inherit the model of the parent agent that invokes them. Zero maintenance.

2. **GitHub Actions workflow & skill templates:** Replace hardcoded model IDs with `${{ vars.OPENCODE_MODEL || 'opencode-go/qwen3.7-plus' }}` expression in `.github/workflows/triaging-gh-issue.yml`, `skills/repo-setup/SKILL.md`, and `training/skills/repo-setup/step3-workflow-content-accuracy.md`. Uses a GitHub repo/org variable with a sensible fallback default.

## Consequences

- Subagents may run on a more expensive model than strictly needed for review tasks. This cost trade-off is accepted in exchange for zero maintenance.
- Works out-of-the-box with the fallback default (`qwen3.7-plus`) — no setup required.
- When a model is retired, updating the `OPENCODE_MODEL` repo/org variable in GitHub settings propagates to all workflows immediately — no code changes needed.
- The user must create the `OPENCODE_MODEL` variable manually at org/repo level.
- The repo-setup skill generates workflows with the same expression, so downstream repos get the same resilience.
