## Scenario
The skill is invoked on a feature branch. `computing-branch-diff` returns STATUS=empty
(no commits relative to base).

## Expected Behavior
The skill reports "No commits on this branch relative to `$BASE`. Nothing to review."
and stops immediately. No reviewer agents are dispatched.

## Pass Criteria
- [ ] STATUS=empty is detected after running `computing-branch-diff`
- [ ] The message references BASE and states nothing to review
- [ ] No reviewer agents are dispatched
- [ ] Execution stops — no unified verdict or report is produced
