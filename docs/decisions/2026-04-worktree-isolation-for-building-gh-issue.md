# 🗂️ 2026-04-worktree-isolation-for-building-gh-issue

> **Status:** Active
> **Issue:** [#98 — building-gh-issue commits directly to main — no worktree or branch created](https://github.com/HeadlessTarry/Token-Effort/issues/98)
> **Date:** 2026-04-26

## 🔍 Context

`building-gh-issue` dispatched execution skills that committed implementation work directly to whatever branch was currently checked out (typically `main`). There was no step to create a feature branch or Git worktree before execution began. The fix belongs in the skill itself — it must not rely on user-level CLAUDE.md configuration or on the execution skills calling `using-git-worktrees` themselves.

## 🏛️ Decision

Insert a new mandatory Phase 3 ("Create worktree") between Phase 2 (move issue to Building) and the execution phase. Phase 3 derives a branch name as `<N>-<slug>` — the issue number prepended to a lowercased, hyphenated, 50-character-truncated title slug — and invokes `superpowers:using-git-worktrees` with path `.claude/worktrees/<branch-name>`. The path and branch name are supplied explicitly so the skill's interactive directory-selection flow is bypassed. Phase 3 is fatal: failure stops the build immediately with a clear error. All subsequent phases were renumbered 4–10.

## 🔮 Consequences

All future `building-gh-issue` builds are isolated from `main` in a dedicated worktree. Branch naming is deterministic and derived from issue metadata at runtime. Phase 3 failure is a hard stop (unlike Phase 2, which is non-fatal and logs a warning). The `superpowers:using-git-worktrees` skill is now a required prerequisite and must be listed in the Prerequisites section of the skill.
