## Scenario

One open issue is currently labelled `enhancement`. Its body reads: "It would be great to have better docs for the configuration options — maybe a new section in the README, or possibly a dedicated settings page in the UI." This could reasonably be either a documentation improvement or an enhancement, making classification ambiguous. The `GITHUB_ACTIONS` environment variable is not set.

## Expected Behaviour

- The issue is fetched and classified, but the mismatch between the current label and the classification is judged ambiguous (not clearly wrong).
- The action for this issue is `no-change`.
- The issue is excluded from the summary table entirely.
- No label write and no comment are made.

## Pass Criteria

- [ ] The issue is not included in the summary table shown to the user.
- [ ] `gh issue edit` is never called for this issue.
- [ ] `gh issue comment` is never called for this issue.
- [ ] Final report shows 0 applied, 0 reclassified, 1 unchanged, 0 failures.
- [ ] No confirmation table or prompt is displayed (there is nothing to confirm)
