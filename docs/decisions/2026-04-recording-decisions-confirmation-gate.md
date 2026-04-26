# 2026-04-recording-decisions-confirmation-gate

> **Status:** Active
> **Issue:** [#72 — recording-decisions skill skips user confirmation when invoked from building-gh-issue](https://github.com/HeadlessTarry/Token-Effort/issues/72)
> **Date:** 2026-04-26

## Context

The `token-effort:recording-decisions` skill is designed to present each ADR field
(Slug, Context, Decision, Consequences) to the user for review before committing.
When invoked from `token-effort:building-gh-issue` Phase 8, rich spec context
pre-populates all fields — and the model was observed skipping the confirmation
loop, committing the ADR directly without user review.

## Decision

Add mandatory per-field `AskUserQuestion` confirmations for Slug, Context, Decision,
and Consequences. Insert a new Phase 4 final approval gate: after Phase 3, assemble
the complete ADR in memory, present it via `AskUserQuestion`, and require an explicit
`yes` before any file write or git commit. Any non-yes response is treated as a
change request and loops back.

## Consequences

Users can no longer skip the confirmation loop regardless of how much spec context
is pre-populated. The approval gate adds one additional interaction round per build
but ensures the ADR reflects user intent. Only explicit `yes` (case-insensitive)
exits the loop — ambiguous affirmatives (e.g. `ok`, `looks good`) do not count.
