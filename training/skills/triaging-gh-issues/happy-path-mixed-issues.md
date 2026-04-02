## Scenario
The user runs `/triaging-gh-issues`. The repo has 3 unlabelled open issues:
- #10 "Add dark mode support" (no body)
- #11 "Login button throws 500 error on submit" (body: "Clicking login causes a 500 error")
- #12 "Update README installation steps" (body: "The install steps in README are outdated")
The MCP tools are available and work correctly. The user responds "yes" to the approval prompt.

## Expected Behavior
The skill reads each issue, searches for duplicates (finds none), classifies them as
enhancement / bug / documentation respectively, displays the triage table, waits for
approval, then calls `issue_write` once per issue with the correct single-element label.

## Pass Criteria
- [ ] `issue_read` was called for all three issues before any label was proposed
- [ ] `search_issues` was called for all three issues
- [ ] #10 was proposed as `enhancement`
- [ ] #11 was proposed as `bug`
- [ ] #12 was proposed as `documentation`
- [ ] The triage summary table was shown before `issue_write` was called
- [ ] `issue_write` was called exactly 3 times, each with a single-element `labels` array
- [ ] Final report listed all 3 applied labels and "3 labels applied"
