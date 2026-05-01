## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). One unlabelled open issue (#50) has the vague title "Improve the thing" and a body that reads: "It would be nice to make this better — maybe a new page, or maybe just update the docs for it." The classification is ambiguous enough that confidence is 70% or lower.

The issue belongs to exactly one GitHub project whose Status field has options: "New", "Brainstorming", "Building", "Done". The issue's current status in the project is "New".

## Expected Behaviour

- The issue is classified (e.g. `enhancement`), action `apply`, confidence ≤ 80%.
- Label is applied via `gh issue edit --add-label`.
- Because confidence does NOT exceed 80%, the project status update step is skipped entirely. `gh project item-edit` is NOT called.

## Pass Criteria

- [ ] `gh issue edit --add-label` is called to apply the label for issue #50.
- [ ] `gh project item-edit` is NOT called.
- [ ] Final report shows 1 applied, 0 reclassified, 0 unchanged, 0 failures.
