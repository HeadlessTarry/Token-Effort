## Scenario
The autoresearch loop is running. `state.json` shows `best_score: 0.80` and `cycles_without_improvement: 0`. Cycle 3 produces a candidate that scores 0.75 — lower than the current best.

## Expected Behavior
Because the candidate score (0.75) does not exceed `best_score` (0.80), the skill discards the candidate, leaves `best.md` unchanged, increments `cycles_without_improvement` to 1, and records the cycle as not kept in `results.jsonl`.

## Pass Criteria
- [ ] Does not overwrite `best.md` (file content remains unchanged)
- [ ] Increments `cycles_without_improvement` to 1 in `state.json`
- [ ] Appends `"kept": false` to the entry in `results.jsonl`
- [ ] Does not write to the live definition file
