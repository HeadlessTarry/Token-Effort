## Scenario

One unlabelled open issue describes a clear feature request (new dark mode theme). The
skill runs in interactive context (`GITHUB_ACTIONS` not set). The user confirms the
proposed label. Classification confidence is 88%.

## Expected Behaviour

- The issue is classified as `enhancement`.
- `gh issue edit --add-label enhancement` is called to apply the label.
- `gh issue comment` is ALSO called to post a triage summary comment — even though this
  is a first-time label application, not a reclassification.

## Pass Criteria

- [ ] `gh issue edit --add-label` is called with label `enhancement`.
- [ ] `gh issue comment` is called exactly once for this issue.
- [ ] The comment body contains `## 🤖 Triage Summary`.
- [ ] The comment is posted after the label is applied.
