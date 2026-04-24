# 2026-04-token-efficiency-haiku-dispatchers

> **Status:** Active
> **Issue:** [#73 — Optimise token usage: delegate mechanical skills to Haiku subagents](https://github.com/HeadlessTarry/Token-Effort/issues/73)
> **Date:** 2026-04-24

## Context

Skills in this plugin run in the caller's Claude session and inherit its model. When a user invokes a skill on Sonnet or Opus, even purely mechanical tasks — running `gh` CLI commands, scanning files, writing YAML — consume expensive tokens unnecessarily. Skills have no `model` frontmatter field (unlike agents), so there is no way to enforce a cheaper model at the skill level.

Separately, two reviewer agents (`reviewer-dead-code`, `reviewer-docs`) were hardcoded at `model: sonnet` despite performing largely mechanical, lookup-based analysis that does not require Sonnet-level reasoning.

## Decision

Two mechanisms were introduced:

**1. Haiku dispatcher pattern (skills):** Three mechanical skills — `computing-branch-diff`, `configuring-dependabot`, and `recording-decisions` — gained a `## Dispatcher` section immediately after their title. This section instructs the running Claude instance to delegate the skill's entire workflow to a `model: haiku` subagent via the `Agent` tool, passing all skill instructions verbatim as the subagent prompt. Skills with interactive steps instruct the Haiku subagent to use `AskUserQuestion` for any mid-task user interaction.

**2. Agent model field change:** `reviewer-dead-code` and `reviewer-docs` had their `model` frontmatter field changed from `sonnet` to `haiku`. No body changes were required — the `model` field is the only lever needed for agents.

Interactive skills (`triaging-gh-issues`, `propose-feature`, `report-bug`, `init-plus`) and complex orchestrators (`building-gh-issue`, `brainstorming-gh-issue`, `planning-gh-issue`, `reviewing-code-systematically`) were explicitly excluded — they require Sonnet-level reasoning or mid-task judgment that Haiku cannot reliably provide.

## Consequences

- Users running mechanical skills on Sonnet or Opus now consume Haiku-tier tokens for those tasks, reducing cost without requiring manual model switching.
- The dispatcher pattern is transparent to the skill's external contract — evals test what the skill produces, not which model ran. All existing evals pass unchanged after the dispatcher addition.
- The agent model downgrades were stress-tested with two new evals (`dynamic-access-not-dead.md`, `stale-file-path-caught.md`) added before the model change. Both agents scored 100% on Sonnet and maintained the same score on Haiku — no quality regression observed.
- Future mechanical skills should apply the Haiku dispatcher pattern by default. The `computing-branch-diff` dispatcher is the reference template for skills that call external scripts; `configuring-dependabot` and `recording-decisions` are the reference templates for interactive skills.
- The `move-issue-status` skill was explicitly deferred to issue #84 and is not modified here.
