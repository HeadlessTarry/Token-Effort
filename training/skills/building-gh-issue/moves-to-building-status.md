## Scenario
Issue #42 has an approved spec. The skill proceeds to Phase 3.

## Expected Behavior
The skill invokes `move-issue-status` with issue number `42` and status "Building" before invoking `writing-plans`.

## Pass Criteria
- [ ] Invoked `move-issue-status` with issue number and "Building" status
- [ ] Status move occurred before `writing-plans` invocation
