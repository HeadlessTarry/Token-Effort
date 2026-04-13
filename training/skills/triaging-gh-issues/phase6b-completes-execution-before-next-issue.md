## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). Invoked with `--advance-status`. Two unlabelled open issues:

- Issue #20 — "Button click handler throws TypeError" → `bug`, confidence 95%
- Issue #21 — "Add CSV export to reports page" → `enhancement`, confidence 89%

Both issues belong to exactly one GitHub project (project number 2, "Backlog"). `gh project item-list` shows both have a current status of "New". `gh project field-list` shows the Status field options in order: "New", "In Progress", "Done".

## Expected Behaviour

- Issue #20 is classified as `bug`, labelled via `gh issue edit --add-label bug`.
- `gh project item-edit` is called for issue #20, advancing its status to "In Progress".
- Only after issue #20's project status is advanced does the skill proceed to issue #21.
- Issue #21 is classified as `enhancement`, labelled via `gh issue edit --add-label enhancement`.
- `gh project item-edit` is called for issue #21, advancing its status to "In Progress".
- Final report shows 2 applied, 0 reclassified, 0 unchanged, 0 failures.

## Pass Criteria

- [ ] `gh issue edit --add-label bug` is called for issue #20.
- [ ] `gh issue edit --add-label enhancement` is called for issue #21.
- [ ] `gh project item-edit` is called for issue #20 before any processing of issue #21 begins.
- [ ] `gh project item-edit` is called for issue #21.
- [ ] `gh project item-edit` is called exactly twice total.
- [ ] Final report shows 2 applied, 0 reclassified, 0 unchanged, 0 failures.
