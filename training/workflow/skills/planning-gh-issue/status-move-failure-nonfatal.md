## Scenario

The user runs `/token-effort-workflow:planning-gh-issue 19`. The issue has a valid spec comment. When Phase 3 attempts to invoke `token-effort-workflow:move-issue-status 19 "Planning"`, the call fails because the "Planning" column does not exist on the project board yet.

## Expected Behaviour

- The status move fails with an error from `token-effort-workflow:move-issue-status`.
- The skill logs a warning (e.g. "⚠️ Warning: could not move issue #19 to Planning status — continuing anyway.") but does NOT stop.
- `superpowers:writing-plans` is invoked as normal.
- The planning session proceeds without interruption.

## Pass Criteria

- [ ] `token-effort-workflow:move-issue-status 19 "Planning"` is invoked.
- [ ] The failure does not halt the skill.
- [ ] A warning is logged mentioning the issue number and the failure to move status.
- [ ] `superpowers:writing-plans` is still invoked after the warning.
- [ ] Phase 4 still runs after user approval.
