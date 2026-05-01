## Scenario

The user runs `/token-effort:planning-gh-issue 88`. The issue has a valid spec comment and no prior plan comment. The project board has a "Planning" column.

## Expected Behaviour

- Phase 3 invokes `token-effort:move-issue-status 88 "Planning"` before invoking `superpowers:writing-plans`.
- The status move completes successfully.
- `superpowers:writing-plans` is then invoked.

## Pass Criteria

- [ ] `token-effort:move-issue-status 88 "Planning"` is called in Phase 3.
- [ ] The status move is called BEFORE `superpowers:writing-plans`.
- [ ] `superpowers:writing-plans` is invoked after the status move.
