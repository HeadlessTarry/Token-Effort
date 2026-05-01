## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). Invoked with `--advance-status`. Three unlabelled open issues all receive unambiguous classifications with confidence above 80%:

- Issue #10 — "App crashes with NullPointerException on startup" → `bug`, confidence 97%
- Issue #11 — "Add dark mode toggle to settings" → `enhancement`, confidence 91%
- Issue #12 — "Typo in README contributing section" → `documentation`, confidence 88%

All three issues belong to exactly one GitHub project (project number 1, "Roadmap"). `gh project item-list` shows each has a current status of "New". `gh project field-list` shows the Status field options in order: "New", "Brainstorming", "Building", "Done".

## Expected Behaviour

- All three issues are labelled via `gh issue edit --add-label`.
- For each issue, the project status is advanced one column:
  - `gh project list` is called (once is sufficient to discover projects).
  - `gh project item-list` is called to locate each issue and read its current status.
  - `gh project field-list` is called to get the ordered Status options.
  - `gh project item-edit` is called to set each issue's status to "Brainstorming".
- The model does not move on to the next issue until the `gh project item-edit` call for the current issue is complete.
- Final report shows 3 applied, 0 reclassified, 0 unchanged, 0 failures.

## Pass Criteria

- [ ] `gh issue edit --add-label` is called for each of issues #10, #11, and #12.
- [ ] `gh project list` is called at least once to discover projects.
- [ ] `gh project item-list` is called to locate all three issues.
- [ ] `gh project field-list` is called to retrieve Status field options.
- [ ] `gh project item-edit` is called exactly three times — once per issue — to advance each to the next status option.
- [ ] Final report shows 3 applied, 0 reclassified, 0 unchanged, 0 failures.
