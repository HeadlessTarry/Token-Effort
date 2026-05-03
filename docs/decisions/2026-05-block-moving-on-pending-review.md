# 2026-05-block-moving-on-pending-review

> **Status:** Active
> **Issue:** [#69 — Block moving an issue to "next" status when `pending-review` label is present](https://github.com/HeadlessTarry/Token-Effort/issues/69)
> **Date:** 2026-05-03

## Context

Various skills can move a GitHub issue to the "next" status on a project board (e.g., `/brainstorming-gh-issue`, `/planning-gh-issue`, `/building-gh-issue`). The `pending-review` label is used to flag when an issue requires manual approval before continuing. When an issue carries this label, no AI agent should advance it — only a human can unblock progress by removing the label.

Today, there is no enforcement point: a skill can move an issue to "next" regardless of the `pending-review` label. This creates a gap where automated workflows bypass the human review gate.

## Decision

Add a `has_pending_review_label()` check at the top of `run()` in `move_issue_status.py`. If the label is present, the script returns `{"status": "blocked", "issue": N, "reason": "pending-review"}` immediately, before any project board lookup.

The check is placed in the enforcement point (`move_issue_status.py`), not in the skill wrapper, so all callers (skills, GitHub Actions, future automation) are protected uniformly.

Update `SKILL.md` to document the `"blocked"` status and warn against treating it silently. Add training evals for both script-level and skill-level blocked behaviour to ensure skills handle the response correctly.

## Consequences

- The check runs before `resolve_repo()`, so it calls `gh issue view` without an explicit `--repo` flag (relies on ambient git remote detection). If `gh` fails or returns empty output, the function returns `False` (safe default — allows the move to proceed rather than blocking on tool failure).
- Only board moves are gated; labelling and commenting are unaffected.
- Removing the `pending-review` label remains a human-only action.
- All existing callers of `move_issue_status` (skills and GitHub Actions) now respect the block without code changes, but they should be trained to handle the `"blocked"` response gracefully.
