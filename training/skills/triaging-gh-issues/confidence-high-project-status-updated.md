## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). Invoked with `--advance-status`. One unlabelled open issue (#42) has the title "App crashes with NullPointerException on startup" and a body containing a full stack trace. The classification is unambiguously `bug` with confidence above 80%.

The issue belongs to exactly one GitHub project (project number 1, titled "Roadmap"). `gh project item-list` shows the issue has a current status of "New". `gh project field-list` shows the Status field has options in this order: "New", "Brainstorming", "Building", "Done".

## Expected Behaviour

- The issue is classified as `bug`, action `apply`, confidence > 80%.
- Label `bug` is applied via `gh issue edit --add-label bug`.
- Because confidence > 80% and exactly one project is associated, the project status is advanced one column to the right:
  - `gh project list` is called to discover projects for the owner.
  - `gh project item-list` is called to locate issue #42 in the project and read its current status ("New").
  - `gh project field-list` is called to get the ordered Status options.
  - The next option after "New" is "Brainstorming" (index 1).
  - `gh project item-edit` is called to set the Status to "Brainstorming".
- No confirmation prompt is shown (GHA context).

## Pass Criteria

- [ ] `gh issue edit --add-label bug` is called for issue #42.
- [ ] `gh project list` is called to discover projects.
- [ ] `gh project item-list` is called to locate the issue and read its current status.
- [ ] `gh project field-list` is called to get the ordered Status options.
- [ ] `gh project item-edit` is called to advance the status to the next option ("Brainstorming").
- [ ] Final report shows 1 applied, 0 reclassified, 0 unchanged, 0 failures.
