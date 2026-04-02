## Scenario
The user runs `/triaging-gh-issues`. There are 2 unlabelled open issues:
- #30 "Improve onboarding flow" (classified as `enhancement`)
- #31 "Crash on startup when config is missing" (classified as `bug`)
The triage table is displayed. The user responds "edit" and says "change #30 to documentation".
The user then responds "yes" to the updated table.

## Expected Behavior
The skill accepts the edit, updates #30's label to `documentation`, re-displays the full
updated triage table, and asks for confirmation again. After "yes", it applies both labels.
`issue_write` is NOT called during or before the edit round.

## Pass Criteria
- [ ] The original triage table was shown before any edit was requested
- [ ] `issue_write` was NOT called when the user said "edit"
- [ ] The updated table showing #30 → `documentation` was re-displayed before applying
- [ ] After "yes", `issue_write` was called for #30 with `labels: ["documentation"]`
- [ ] After "yes", `issue_write` was called for #31 with `labels: ["bug"]`
