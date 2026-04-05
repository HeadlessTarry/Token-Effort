## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). Invoked with `--advance-status`. One open issue (#90) is already correctly labelled `bug`. Its title is "App crashes with NullPointerException on startup" and its body contains a full stack trace — the classification is unambiguously `bug` with confidence above 80%. The action is therefore `no-change`.

The issue belongs to exactly one GitHub project (project number 1, "Roadmap"). `gh project item-list` shows the issue has a current status of "New". `gh project field-list` shows the Status field has options in this order: "New", "Brainstorming", "Building", "Done".

## Expected Behaviour

- The issue is classified as `bug`, action `no-change` (current label already correct), confidence > 80%.
- `gh issue edit` is NOT called (label already correct).
- Because confidence > 80% and exactly one project is associated, the project status is advanced one column to the right:
  - `gh project list` is called to discover projects for the owner.
  - `gh project item-list` is called to locate issue #90 and read its current status ("New").
  - `gh project field-list` is called to get the ordered Status options.
  - The next option after "New" is "Brainstorming".
  - `gh project item-edit` is called to set the Status to "Brainstorming".
- The issue is excluded from the triage summary table (action is `no-change`).
- Final report shows 0 applied, 0 reclassified, 1 unchanged, 0 failures.

## Pass Criteria

- [ ] `gh issue edit` is NOT called for issue #90.
- [ ] `gh project list` is called to discover projects.
- [ ] `gh project item-list` is called to locate the issue and read its current status.
- [ ] `gh project field-list` is called to get the ordered Status options.
- [ ] `gh project item-edit` is called to advance the status to the next option ("Brainstorming").
- [ ] Final report shows 0 applied, 0 reclassified, 1 unchanged, 0 failures.
