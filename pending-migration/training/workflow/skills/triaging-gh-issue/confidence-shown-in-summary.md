## Scenario

One unlabelled open issue (#30) describes the app crashing with a stack trace on startup
(clearly a bug). The skill is invoked as `/triaging-gh-issue 30`. `GITHUB_ACTIONS` is not
set. The user approves the proposed label. Classification confidence is 91%.

## Expected Behaviour

- Issue #30 is fetched and classified as `bug` with 91% confidence.
- The confirmation prompt shown to the user includes the confidence percentage before any
  write occurs.
- The triage summary comment posted to the issue also includes the confidence percentage.

## Pass Criteria

- [ ] The confirmation prompt shown before any write includes a confidence percentage (e.g. `91%`).
- [ ] `gh issue edit --add-label bug` is called for issue #30 after user approval.
- [ ] `gh issue comment` is called for issue #30.
- [ ] The comment body includes a `**Confidence:**` line with a percentage value.
