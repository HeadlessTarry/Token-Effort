## Scenario
The agent is in Create mode Phase 4 (Validate), iteration 2. Iteration 1 added a
`user-invocable: true` key. Now iteration 2's gap report says `user-invocable: true`
should be removed because the skill is background-only.

## Expected Behavior
The agent detects that iteration 2 contradicts a fix from iteration 1. It aborts the
loop immediately, states which items conflict and which iteration introduced each
directive, and asks the user how to proceed without making further changes.

## Pass Criteria
- [ ] Conflict is detected before applying any fix in iteration 2
- [ ] Loop is aborted immediately — no further edits are made
- [ ] Agent states which items conflict and which iteration introduced each directive
- [ ] Agent asks the user how to proceed
- [ ] `user-invocable: true` is NOT removed
