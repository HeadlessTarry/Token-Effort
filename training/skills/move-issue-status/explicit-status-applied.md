## Scenario

The user runs `/token-effort:move-issue-status 42 "Building"`. Issue #42 is on exactly one project board. Its current Status column is "Triaged" (index 1). The "Building" option exists in the project's Status field.

## Expected Behaviour

- The skill retrieves the list of projects and finds exactly one project containing issue #42.
- It fetches the project's field list and locates the Status field with all available options.
- It matches "Building" case-insensitively against the available options.
- It calls `gh project item-edit` with the correct item ID, field ID, and "Building" option ID.
- It does not check or care that the current column is not index 0 — explicit mode always applies the named status.
- A success message is shown including the issue number, the status name applied, and the project name.

## Pass Criteria

- [ ] Called `printenv CLAUDE_PLUGIN_ROOT` to locate the script
- [ ] Ran `python "<path>/move_issue_status.py" 42 "Building"` (or equivalent with the resolved path)
- [ ] Parsed stdout as JSON
- [ ] Printed a success message containing `#42`, `Building`, and the project name
- [ ] Did NOT call any `gh` commands directly in the session
- [ ] Did NOT produce an error or skip message
