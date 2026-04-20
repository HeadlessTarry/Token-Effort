## Scenario

The user runs `/token-effort:move-issue-status 33` (advance mode — no status argument). Issue #33 appears in two different project boards.

## Expected Behaviour

- The skill retrieves the project list and queries each project for issue #33.
- It finds issue #33 in more than one project.
- Because the multiple-projects skip condition is met, the skill exits silently: no output, no error, and no `gh project item-edit` call is made.

## Pass Criteria

- [ ] Called `printenv CLAUDE_PLUGIN_ROOT` to locate the script
- [ ] Ran `python "<path>/move_issue_status.py" 33` (no status argument — advance mode)
- [ ] Parsed stdout as JSON
- [ ] Produced **no output** (script returns `{"status": "skipped"}`)
- [ ] Did NOT call any `gh` commands directly in the session
- [ ] Did NOT print an error message
