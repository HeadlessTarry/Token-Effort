## Scenario
User runs `/run-training starting-git-branch`. The definition file exists and 3 eval files are present. No `.training-results/` directory exists yet. Phase 3 (Baseline) runs for the first time.

## Expected Behavior
The skill reads the definition, evaluates all 3 evals, computes a score, writes `state.json` with the correct initial fields, and copies the live definition to `.training-results/best.md`. It then reports the baseline score to the user before entering the loop.

## Pass Criteria
- [ ] Writes `state.json` with `"iteration": 0`
- [ ] Sets `baseline_score` and `best_score` to the same computed value in `state.json`
- [ ] Sets `"cycles_without_improvement": 0` in `state.json`
- [ ] Copies the current live definition to `.training-results/best.md` before the first loop cycle
- [ ] Reports the baseline score to the user
