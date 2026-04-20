## Scenario

The user runs `/token-effort:move-issue-status 99 "In Progress"` (explicit mode). Issue #99 does not appear in any project board.

## Expected Behaviour

- The skill retrieves the project list and queries each project for issue #99.
- No project contains issue #99.
- The skill reports a clear error message stating that issue #99 was not found on any project board.
- Execution stops immediately after the error. No `gh project item-edit` call is made.

## Pass Criteria

- [ ] Called `printenv CLAUDE_PLUGIN_ROOT` to locate the script
- [ ] Ran `python "<path>/move_issue_status.py" 99 "In Progress"`
- [ ] Parsed stdout as JSON
- [ ] Reported an error message naming issue #99 (from the `message` field)
- [ ] Did NOT call any `gh` commands directly in the session
- [ ] Did NOT call `gh project item-edit`
