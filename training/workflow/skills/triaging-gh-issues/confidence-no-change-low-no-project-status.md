## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). One open issue (#95) is already labelled `enhancement`. Its title is "Improve the thing" and its body is vague — could be a feature request or documentation update. The classification is `enhancement` (matching current label), action `no-change`, but confidence is ≤ 80% due to ambiguity.

The issue belongs to exactly one GitHub project whose Status field has options: "New", "Brainstorming", "Building", "Done". The issue's current status in the project is "New".

## Expected Behaviour

- The issue is classified as `enhancement`, action `no-change` (current label matches), confidence ≤ 80%.
- `gh issue edit` is NOT called.
- Because confidence does NOT exceed 80%, the project status update step is skipped entirely. `gh project item-edit` is NOT called.
- Final report shows 0 applied, 0 reclassified, 1 unchanged, 0 failures.

## Pass Criteria

- [ ] `gh issue edit` is NOT called for issue #95.
- [ ] `gh project item-edit` is NOT called.
- [ ] Final report shows 0 applied, 0 reclassified, 1 unchanged, 0 failures.
