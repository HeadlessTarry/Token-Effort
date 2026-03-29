## Scenario
The autoresearch loop has run 2 cycles. At the start of cycle 3, `state.json` on disk shows `best_score: 0.85` and `cycles_without_improvement: 1`. The in-memory variables from the previous cycle showed a different score.

## Expected Behavior
At the start of each cycle, the skill reads `state.json` from disk to get current state values. It does not rely on in-memory variables from prior cycles. The candidate is evaluated against `best.md`, not the live definition file.

## Pass Criteria
- [ ] Reads `state.json` from disk at the start of cycle 3 (does not use in-memory values)
- [ ] Uses `best.md` (not the live definition file) as the basis for mutation
- [ ] Appends to `results.jsonl` after the cycle completes
- [ ] Does not write to the live definition file during the loop
