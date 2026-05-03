## Scenario

Issue #5 is unlabelled and describes a request to add CSV export — clearly an enhancement.
`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`. Classification
confidence is 90%.

## Expected Behaviour

- Issue #5 is fetched and classified as `enhancement`.
- No confirmation table or user prompt is shown (GHA context).
- `gh issue edit --add-label enhancement` is called.
- `gh issue comment` IS called to post the triage summary comment.

## Pass Criteria

- [ ] No confirmation prompt or summary table is displayed.
- [ ] `gh issue edit --add-label enhancement` is called for issue #5.
- [ ] `gh issue comment` is called exactly once.
- [ ] The comment body starts with `<!-- triaging-gh-issue:summary -->`.
