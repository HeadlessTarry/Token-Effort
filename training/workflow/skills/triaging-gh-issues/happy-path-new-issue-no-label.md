## Scenario

Two unlabelled open issues exist in the repository: one describes a button that crashes the app when clicked (clearly a bug), and the other requests a new dark mode theme (clearly a feature request). The `GITHUB_ACTIONS` environment variable is not set, so the skill is running interactively. The user approves the proposed changes.

## Expected Behaviour

- Both issues are fetched, classified, and assigned action `apply` (no prior label).
- A summary table is displayed showing both issues before any writes occur.
- The skill waits for user confirmation and proceeds only after the user says "yes".
- `gh issue edit --add-label` is called for each issue to apply the classified label.
- `gh issue comment` is NOT called for either issue (apply action, not reclassify).

## Pass Criteria

- [ ] Both issues appear in the summary table before any `gh issue edit` call is made.
- [ ] The summary table shows the bug issue classified as `bug` and the feature request classified as `enhancement`.
- [ ] `gh issue edit --add-label` is called exactly twice — once for each issue — after user approval.
- [ ] `gh issue comment` is never called for either issue.
- [ ] Final report shows 2 applied, 0 reclassified, 0 unchanged, 0 failures.
