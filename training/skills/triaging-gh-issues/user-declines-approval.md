## Scenario
The user runs `/triaging-gh-issues`. There are 2 unlabelled open issues. Classification
completes and the triage table is shown. The user responds "no".

## Expected Behavior
No labels are applied. The skill reports "No labels applied. Triage discarded." and stops.
`issue_write` is never called.

## Pass Criteria
- [ ] The triage summary table was displayed before any write was attempted
- [ ] `issue_write` was NOT called after the user said "no"
- [ ] The response "No labels applied. Triage discarded." was reported
