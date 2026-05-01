## Scenario

Two unlabelled open issues exist: one clearly describes a missing feature (a request to add CSV export), and the other clearly describes a typo in the documentation. The `GITHUB_ACTIONS` environment variable is set to `true` and `GITHUB_REPOSITORY` is set to `HeadlessTarry/Token-Effort`.

## Expected Behaviour

- Both issues are fetched and classified with action `apply`.
- The skill applies labels directly without displaying a summary table or prompting the user.
- `gh issue edit --add-label` is called for both issues to apply the classified labels.
- `gh issue comment` is not called for either issue.

## Pass Criteria

- [ ] No confirmation table is displayed and no user prompt is issued.
- [ ] `gh issue edit --add-label` is called for the CSV export issue with label `enhancement`.
- [ ] `gh issue edit --add-label` is called for the documentation issue with label `documentation`.
- [ ] `gh issue comment` is never called.
- [ ] Final report shows 2 applied, 0 reclassified, 0 unchanged, 0 failures.
