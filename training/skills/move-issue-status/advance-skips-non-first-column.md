## Scenario

The user runs `/token-effort:move-issue-status 17` (advance mode — no status argument). Issue #17 is on exactly one project board, currently in the "Building" column (index 1, not the first column).

## Expected Behaviour

- The skill retrieves the project list and finds exactly one project containing issue #17.
- It determines the current Status column index for issue #17.
- Because the current column index is greater than 0 (it is not the first column), the skip condition is met.
- The skill exits silently: no output, no error, and no `gh project item-edit` call is made.

## Pass Criteria

- [ ] `gh project list` is called to enumerate projects.
- [ ] `gh project item-list` is called to locate issue #17 in the project.
- [ ] The current status index is determined to be greater than 0.
- [ ] `gh project item-edit` is NOT called.
- [ ] No error message is shown.
- [ ] No output of any kind is produced.
