## Scenario

One open issue is currently labelled `enhancement`. Its title is "App crashes on startup" and its body describes a null-pointer exception stack trace — unambiguously a bug. The `GITHUB_ACTIONS` environment variable is set to `true`.

## Expected Behaviour

- The issue is fetched and classified as `bug`.
- Because the current label (`enhancement`) is clearly wrong, the action is `reclassify`.
- No confirmation table is shown and no user prompt is given (GHA context).
- `issue_write` is called to change the label from `enhancement` to `bug`.
- `add_issue_comment` is called with a comment that records the old label and new label.

## Pass Criteria

- [ ] The skill does not display a confirmation table or prompt the user for input.
- [ ] `issue_write` is called with the new label `bug` for the issue.
- [ ] `add_issue_comment` is called exactly once for this issue.
- [ ] The comment references the old label `enhancement` and the new label `bug`.
- [ ] Final report shows 0 applied, 1 reclassified, 0 unchanged, 0 failures.
