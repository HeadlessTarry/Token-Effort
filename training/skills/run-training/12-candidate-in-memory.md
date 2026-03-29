## Scenario
During a loop cycle, the skill applies a `tighten-language` mutation to `best.md` to produce a candidate definition. The candidate is then evaluated against all evals. The candidate scores the same as the current best, so it is not kept.

## Expected Behavior
The candidate definition is held in memory throughout mutation and evaluation. No new file is created for the candidate. After evaluation, only `results.jsonl` and `state.json` are updated (since the score did not improve, `best.md` is also unchanged).

## Pass Criteria
- [ ] No new file is written to disk during mutation or evaluation of the candidate
- [ ] The candidate definition is not persisted anywhere on disk during scoring
- [ ] After the cycle, only `results.jsonl` and `state.json` reflect the cycle's outcome
- [ ] `best.md` is not modified (score did not improve)
