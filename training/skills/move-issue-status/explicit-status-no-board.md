## Scenario

The user runs `/token-effort:move-issue-status 99 "In Progress"` (explicit mode). Issue #99 does not appear in any project board.

## Expected Behaviour

- The skill retrieves the project list and queries each project for issue #99.
- No project contains issue #99.
- The skill reports a clear error message stating that issue #99 was not found on any project board.
- Execution stops immediately after the error. No `gh project item-edit` call is made.

## Pass Criteria

- [ ] `gh project list` is called to enumerate projects.
- [ ] `gh project item-list` is called to search for issue #99 across projects.
- [ ] Zero matching projects are found.
- [ ] `gh project item-edit` is NOT called.
- [ ] A clear error message is reported that names the issue number (99).
- [ ] Execution stops after the error with no further steps attempted.
