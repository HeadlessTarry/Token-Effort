## Scenario

Issue #10 is unlabelled and describes a button that crashes the app when clicked — clearly
a bug. The skill is invoked with argument `10`. `GITHUB_ACTIONS` is not set. The user
approves the proposed label when prompted.

## Expected Behaviour

- Issue #10 is fetched via `gh issue view 10`.
- The issue is classified as `bug` with high confidence (≥ 70%).
- A confirmation prompt is shown before any write.
- After user confirms, `gh issue edit --add-label bug` is called.
- `gh issue comment` is called to post the triage summary.

## Pass Criteria

- [ ] `gh issue view 10` is called (not `gh issue list`).
- [ ] The issue is classified as `bug`.
- [ ] A confirmation prompt is displayed before any write.
- [ ] `gh issue edit --add-label bug` is called after confirmation.
- [ ] `gh issue comment` is called exactly once.
- [ ] Triage output references issue #10.
