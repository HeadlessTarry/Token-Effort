## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). One unlabelled open issue (#61) has the title "UI button misaligned on mobile" with a screenshot in the body. Classification is unambiguously `bug` with confidence above 80%.

The issue belongs to exactly one GitHub project (project 1, "Roadmap"). `gh project item-list` shows the issue exists in the project but its `status` field is null/empty — no status has been set. `gh project field-list` shows the Status field options in order: "New", "Brainstorming", "Building", "Done".

## Expected Behaviour

- The issue is classified as `bug`, action `apply`, confidence > 80%.
- Label `bug` is applied via `gh issue edit --add-label bug`.
- `gh project list` is called to discover projects.
- `gh project item-list` is called; the issue's current status is null/empty.
- Because there is no current status to advance from, the project status update is skipped silently. `gh project item-edit` is NOT called.

## Pass Criteria

- [ ] `gh issue edit --add-label bug` is called for issue #61.
- [ ] `gh project item-list` is called to read the issue's current status.
- [ ] `gh project item-edit` is NOT called (no current status to advance from).
- [ ] No error is reported for the skipped status update.
- [ ] Final report shows 1 applied, 0 reclassified, 0 unchanged, 0 failures.
