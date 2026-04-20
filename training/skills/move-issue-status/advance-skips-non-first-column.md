## Scenario

The user runs `/token-effort:move-issue-status 17` (advance mode — no status argument). Issue #17 is on exactly one project board, currently in the "Building" column (index 1, not the first column).

## Expected Behaviour

- The skill retrieves the project list and finds exactly one project containing issue #17.
- It determines the current Status column index for issue #17.
- Because the current column index is greater than 0 (it is not the first column), the skip condition is met.
- The skill exits silently: no output, no error, and no `gh project item-edit` call is made.

## Pass Criteria

- [ ] Called `printenv CLAUDE_PLUGIN_ROOT` to locate the script
- [ ] Ran `python "<path>/move_issue_status.py" 17` (no status argument — advance mode)
- [ ] Parsed stdout as JSON
- [ ] Produced **no output** (script returns `{"status": "skipped"}`)
- [ ] Did NOT call any `gh` commands directly in the session
- [ ] Did NOT print an error message
