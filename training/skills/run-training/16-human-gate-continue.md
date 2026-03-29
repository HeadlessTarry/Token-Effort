## Scenario
The human gate fires after cycle 5 (every-5-cycles trigger). `state.json` shows `iteration: 5`, `best_score: 0.88`, `cycles_without_improvement: 1`. The user responds "continue 3 more cycles".

## Expected Behavior
The loop resumes from iteration 5, reading fresh state from `state.json` at the start of cycle 6. It runs cycles 6, 7, and 8, then pauses again at the next human gate trigger. It does not reinitialize `state.json` or `best.md`.

## Pass Criteria
- [ ] Resumes from the current iteration count (cycle 6 follows cycle 5) without resetting
- [ ] Reads fresh state from `state.json` at the start of cycle 6 (does not use in-memory values)
- [ ] Does not reinitialize `state.json` or overwrite `best.md` on resumption
- [ ] Pauses again after running exactly 3 more cycles (at cycle 8)
