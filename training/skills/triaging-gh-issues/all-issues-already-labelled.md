## Scenario
The user runs `/triaging-gh-issues`. The repo has 4 open issues, all of which already
have at least one label assigned. MCP tools are available.

## Expected Behavior
The skill fetches open issues, finds none without labels, and stops immediately with
the message "All open issues already have labels. Nothing to triage."
No `issue_read`, `search_issues`, or `issue_write` calls are made.

## Pass Criteria
- [ ] `list_issues` was called with `state: open`
- [ ] The stop message "All open issues already have labels. Nothing to triage." was reported
- [ ] `issue_read` was NOT called
- [ ] `issue_write` was NOT called
