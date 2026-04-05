## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). One unlabelled open issue (#42) has the title "App crashes with NullPointerException on startup" and a body containing a full stack trace. The classification is unambiguously `bug` with confidence above 80%.

The issue belongs to exactly one GitHub project (project number 1, titled "Roadmap"). That project's Status field includes a "Brainstorming" single-select option.

## Expected Behaviour

- The issue is classified as `bug`, action `apply`, confidence > 80%.
- Label `bug` is applied via `gh issue edit --add-label bug`.
- Because confidence > 80% and exactly one project is associated, the project status is updated to "Brainstorming":
  - `gh project list` is called to discover projects for the owner.
  - `gh project item-list` is called to locate issue #42 within the project and get its item ID.
  - `gh project field-list` is called to find the Status field ID and the "Brainstorming" option ID.
  - `gh project item-edit` is called to set the Status field to "Brainstorming".
- No confirmation prompt is shown (GHA context).

## Pass Criteria

- [ ] `gh issue edit --add-label bug` is called for issue #42.
- [ ] `gh project list` is called to discover projects.
- [ ] `gh project item-list` is called to locate the issue in the project.
- [ ] `gh project field-list` is called to find the Status field and "Brainstorming" option ID.
- [ ] `gh project item-edit` is called to set the status to "Brainstorming".
- [ ] Final report shows 1 applied, 0 reclassified, 0 unchanged, 0 failures.
