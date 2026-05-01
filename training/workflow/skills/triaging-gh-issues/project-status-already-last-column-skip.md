## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). One unlabelled open issue (#55) has the title "Memory leak when processing large files" and a detailed bug report body. Classification is unambiguously `bug` with confidence above 80%.

The issue belongs to exactly one GitHub project (project 1, "Roadmap"). `gh project item-list` shows the issue's current status is "Done". `gh project field-list` shows the Status field options in order: "New", "Brainstorming", "Building", "Done".

## Expected Behaviour

- The issue is classified as `bug`, action `apply`, confidence > 80%.
- Label `bug` is applied via `gh issue edit --add-label bug`.
- `gh project list` is called to discover projects.
- `gh project item-list` is called to read the current status ("Done").
- `gh project field-list` is called to read the ordered options.
- "Done" is the last option (index 3 of 3) — there is no next column. The project status update is skipped silently. `gh project item-edit` is NOT called.

## Pass Criteria

- [ ] `gh issue edit --add-label bug` is called for issue #55.
- [ ] `gh project item-list` is called to read the issue's current status.
- [ ] `gh project field-list` is called to read the ordered Status options.
- [ ] `gh project item-edit` is NOT called (already at last column).
- [ ] No error is reported for the skipped status update.
- [ ] Final report shows 1 applied, 0 reclassified, 0 unchanged, 0 failures.
