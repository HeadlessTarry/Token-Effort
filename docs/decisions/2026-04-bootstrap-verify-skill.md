# 2026-04-bootstrap-verify-skill

> **Status:** Active
> **Issue:** [#32 — New skill: `/verify`](https://github.com/HeadlessTarry/Token-Effort/issues/32)
> **Date:** 2026-04-18

## Context

Every project has its own set of verification steps needed to confirm that code changes work correctly. These vary widely across ecosystems:
- Java projects: `mvn clean verify`
- npm projects: `npm run full-build`
- Python projects: `python -m build`
- Shell projects: `run_checks.sh`

Without explicit guidance, AI agents guess which commands to run — and often miss critical checks, leading to false negatives and incomplete verification. A per-project verification mechanism allows each codebase to define its own workflow, and allows agents to follow it without guessing.

## Decision

Add Step 6 "Bootstrap `/verify` skill" to the `init-plus` skill (`plugins/token-effort/skills/init-plus/SKILL.md`).

This step:
1. Checks if a project already has `.claude/skills/verify/SKILL.md` and skips if so (respecting user modifications)
2. Interviews the user: "What commands should be run to verify this project is working correctly?" in order
3. Confirms the command list before writing
4. Writes `.claude/skills/verify/SKILL.md` with a simple template that runs each command and stops on first failure

The implementation uses a direct markdown template, not sub-skill delegation. This keeps the bootstrap phase lightweight and self-contained. The generated skill has stop-on-failure as the default behavior, ensuring verification is all-or-nothing and preventing false negatives from partial test runs.

## Consequences

**Positive:**
- Projects now have an explicit, project-specific way to define verification workflows
- AI agents can invoke `/verify` with confidence that it runs the right checks for that project
- The interview-based configuration ensures command lists are correct and user-confirmed before writing
- Stop-on-failure prevents partial test runs and incomplete verification

**Limitations and trade-offs:**
- Users must manually run `/init-plus` and select Step 6 to bootstrap `/verify` for each project — it does not happen automatically
- The generated `/verify` skill is simple and synchronous — future needs for conditional command paths, parameterized checks, or asynchronous execution would require template refinement
- Step 6 interviews in free-form order but stores commands as a numbered list; if a user later wants to reorder commands, they must edit `.claude/skills/verify/SKILL.md` manually
