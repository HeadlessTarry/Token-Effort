## Scenario

The user runs `/planning-gh-issue 88`. The issue has a valid spec comment and no prior plan comment. The project board has a "Planning" column.

## Expected Behaviour

- Phase 3 invokes `move-issue-status 88 "Planning"` before invoking `writing-plans`.
- The status move completes successfully.
- `writing-plans` is then invoked.

## Pass Criteria

- [ ] `move-issue-status 88 "Planning"` is called in Phase 3.
- [ ] The status move is called BEFORE `writing-plans`.
- [ ] `writing-plans` is invoked after the status move.
