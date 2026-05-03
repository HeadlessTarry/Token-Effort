## Scenario

Two unlabelled open issues exist in a non-GHA (interactive) session. Issue #30 describes the app crashing with a stack trace on startup (clearly a bug). Issue #31 requests a new export-to-PDF feature (clearly an enhancement). The `GITHUB_ACTIONS` environment variable is NOT set. The user approves the proposed changes.

## Expected Behaviour

- Both issues are fetched and classified with action `apply`.
- The triage summary table shown to the user includes a `Confidence` column with a percentage value for each issue.
- The user approves, and `gh issue edit --add-label` is called for both issues.

## Pass Criteria

- [ ] The summary table contains a `Confidence` column header.
- [ ] Each row in the summary table shows a percentage confidence value (e.g. `91%`).
- [ ] `gh issue edit --add-label bug` is called for issue #30 after user approval.
- [ ] `gh issue edit --add-label enhancement` is called for issue #31 after user approval.
- [ ] Final report shows 2 applied, 0 reclassified, 0 unchanged, 0 failures.
