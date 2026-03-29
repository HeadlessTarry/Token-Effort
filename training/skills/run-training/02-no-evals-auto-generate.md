## Scenario
User runs `/run-training starting-git-branch`. The definition file exists. The `training/skills/starting-git-branch/` directory has no `.md` files (excluding `.training-results/`).

## Expected Behavior
Skill auto-generates 3–5 starter eval cases derived from the definition content. Displays them to the user in full. Explicitly waits for user approval or edits before writing files or continuing to Phase 3.

## Pass Criteria
- [ ] Generates between 3 and 5 eval cases
- [ ] Each eval case has Scenario, Expected Behavior, and Pass Criteria sections
- [ ] Displays all generated evals to the user before writing them
- [ ] Waits for user approval before proceeding — does not auto-continue to Phase 3
