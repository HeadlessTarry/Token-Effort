## Scenario

The user runs `/token-effort:move-issue-status 33` (advance mode — no status argument). Issue #33 appears in two different project boards.

## Expected Behaviour

- The skill retrieves the project list and queries each project for issue #33.
- It finds issue #33 in more than one project.
- Because the multiple-projects skip condition is met, the skill exits silently: no output, no error, and no `gh project item-edit` call is made.

## Pass Criteria

- [ ] `gh project list` is called to enumerate projects.
- [ ] `gh project item-list` is called for each project to search for issue #33.
- [ ] Issue #33 is found in more than one project.
- [ ] `gh project item-edit` is NOT called.
- [ ] No error message is shown.
- [ ] No output of any kind is produced.
