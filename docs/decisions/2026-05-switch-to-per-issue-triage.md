# 2026-05-switch-to-per-issue-triage

> **Status:** Active
> **Issue:** [#62 — Switch to per-issue triage](https://github.com/HeadlessTarry/Token-Effort/issues/62)
> **Date:** 2026-05-03

## Context

The `triaging-gh-issues` skill previously operated in bulk — fetching all open issues and running one `gh search issues` call per issue, causing O(N) API fragility and cancellation errors. Issues also sat in the "New" column for days waiting for the Monday cron run. The fix is to scope the skill to a single issue triggered on `issues.opened`.

## Decision

Rewrite `triaging-gh-issues` to accept a single issue number (from args or branch name), classify it, and always post a triage summary comment. Renaming the skill to `triaging-gh-issue` (singular) in the process. Update the `init-plus` workflow template to trigger on `issues.opened` with a `workflow_dispatch` fallback passing the issue number, replacing the Monday morning cron schedule.

## Consequences

Bulk-triage capability is removed — the skill no longer processes multiple issues in one run. Each issue is triaged immediately when opened rather than waiting for the next Monday cron run. Existing repos that used the old scheduled workflow must re-run `/init-plus` to adopt the new skill name and a `issues.opened` trigger. The `workflow_dispatch` fallback allows maintainers to manually re-triage any issue.
