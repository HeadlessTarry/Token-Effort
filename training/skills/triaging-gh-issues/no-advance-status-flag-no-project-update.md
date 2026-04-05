## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). Invoked as `/triaging-gh-issues` — WITHOUT the `--advance-status` flag. One unlabelled open issue (#42) has the title "App crashes with NullPointerException on startup" and a body containing a full stack trace. The classification is unambiguously `bug` with confidence above 80%.

The issue belongs to exactly one GitHub project (project 1, "Roadmap"). Its current status is "New" — the first column. All conditions for a project status update would be met if `--advance-status` had been passed.

## Expected Behaviour

- The issue is classified as `bug`, action `apply`, confidence > 80%.
- Label `bug` is applied via `gh issue edit --add-label bug`.
- Because `--advance-status` was NOT passed, Phase 6b is skipped entirely. No `gh project` commands are called.

## Pass Criteria

- [ ] `gh issue edit --add-label bug` is called for issue #42.
- [ ] `gh project list` is NOT called.
- [ ] `gh project item-list` is NOT called.
- [ ] `gh project field-list` is NOT called.
- [ ] `gh project item-edit` is NOT called.
- [ ] Final report shows 1 applied, 0 reclassified, 0 unchanged, 0 failures.
