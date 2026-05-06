## Scenario
The agent is in Create mode Phase 4 (Validate), iteration 2. Iteration 1 added a
`background: false` field. Now iteration 2's gap report says `background: false` should
be removed because it is redundant.

## Expected Behavior
The agent detects that iteration 2 is asking it to undo a change made in iteration 1.
It aborts the feedback loop immediately, reports the conflicting items (which iteration
each came from), and asks the user how to proceed. It does not apply the contradictory fix.

## Pass Criteria
- [ ] Agent detects the conflict before applying any fix in iteration 2
- [ ] Loop is aborted — no further edits are made
- [ ] Agent states which items conflict and which iteration introduced each directive
- [ ] Agent asks the user how to proceed
- [ ] The `background: false` field is NOT removed
