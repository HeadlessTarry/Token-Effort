## Scenario
User runs `/run-training starting-git-branch`. The definition file exists. The `training/skills/starting-git-branch/` directory contains 4 `.md` eval files and a `.training-results/` subdirectory with `state.json`, `best.md`, and `results.jsonl`.

## Expected Behavior
The skill loads the 4 `.md` files from the evals directory, ignores everything inside `.training-results/`, and reports the count of loaded evals to the user before proceeding to Phase 3.

## Pass Criteria
- [ ] Loads exactly 4 eval files (the `.md` files in the root of the evals directory)
- [ ] Does not count or load files from inside `.training-results/`
- [ ] Reports the count of loaded evals to the user before proceeding
