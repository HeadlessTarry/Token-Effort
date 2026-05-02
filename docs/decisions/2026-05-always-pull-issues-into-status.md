# 2026-05-always-pull-issues-into-status

> **Status:** Active
> **Issue:** [#108 — Always "pull" issues into status when starting that stage](https://github.com/HeadlessTarry/Token-Effort/issues/108)
> **Date:** 2026-05-02

## Context

The issue lifecycle had an inconsistency in how issues moved between project board columns. `/planning-gh-issue` and `/building-gh-issue` pulled issues into their column at the point of invocation — the status change signals that work has started. `/triaging-gh-issues` with `--advance-status` pushed issues into "Brainstorming" at triage time, with no guarantee that brainstorming would actually commence. This meant an issue could appear as "In Brainstorming" on the board before any brainstorming had started.

## Decision

Make status advancement consistent across all workflow stages: triaging only classifies and labels issues; each downstream skill (brainstorming, planning, building) is responsible for pulling its issue into the appropriate project board column when it begins work. Removed `--advance-status` flag and Phase 6b from `triaging-gh-issues`; added a `move-issue-status "Brainstorming"` call at the start of `brainstorming-gh-issue`; removed auto-labels from GitHub issue templates so labels are applied by triage only; updated `init-plus` generated artefacts to match.

## Consequences

Issues no longer receive a project board status update immediately after triage. Board status reflects actual work state (brainstorming is in progress) rather than queued state (issue has been triaged and is waiting). Triage is now a purely labelling operation. New issues land without labels and receive their first label through the triage workflow. The `--advance-status` flag is removed; any existing workflow configurations using it must be updated.
