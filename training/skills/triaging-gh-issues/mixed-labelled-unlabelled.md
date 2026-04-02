## Scenario
The user runs `/triaging-gh-issues`. `list_issues` returns 5 open issues:
- #1 (labels: ["bug"]) — already labelled
- #2 (labels: []) — unlabelled
- #3 (labels: ["enhancement"]) — already labelled
- #4 (labels: []) — unlabelled
- #5 (labels: ["documentation"]) — already labelled

## Expected Behavior
Only #2 and #4 enter the triage list. Issues #1, #3, and #5 are silently skipped.
The skill reports "Found 2 unlabelled open issues. Starting triage…" and proceeds
to classify only #2 and #4.

## Pass Criteria
- [ ] `issue_read` was called for #2 and #4 only
- [ ] `issue_read` was NOT called for #1, #3, or #5
- [ ] The reported count was 2, not 5
- [ ] The triage summary table contained exactly 2 rows (#2 and #4)
