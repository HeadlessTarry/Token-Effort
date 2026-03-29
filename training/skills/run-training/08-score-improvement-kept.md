## Scenario
The autoresearch loop is running. `state.json` shows `best_score: 0.75`. Cycle 2 produces a candidate definition that scores 0.85 when evaluated against all evals.

## Expected Behavior
Because the candidate score (0.85) exceeds `best_score` (0.75), the skill overwrites `best.md` with the candidate, updates `best_score` to 0.85, resets `cycles_without_improvement` to 0, and records the cycle as kept in `results.jsonl`. The live definition file is not touched.

## Pass Criteria
- [ ] Overwrites `.training-results/best.md` with the improved candidate definition
- [ ] Updates `best_score` in `state.json` to 0.85
- [ ] Resets `cycles_without_improvement` to 0 in `state.json`
- [ ] Appends `"kept": true` to the entry in `results.jsonl`
- [ ] Does not write to the live definition file
