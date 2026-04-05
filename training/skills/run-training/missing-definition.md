## Scenario
User runs `/run-training nonexistent-skill`. The file `plugins/token-effort/skills/nonexistent-skill/SKILL.md` does not exist.

## Expected Behavior
Skill resolves the path, checks for the file, finds it missing, stops immediately, and reports the error to the user. Does not attempt to create evals or proceed to Phase 3.

## Pass Criteria
- [ ] Checks for definition file existence before proceeding
- [ ] Reports a clear error message naming the missing path
- [ ] Does not proceed to Phase 2 or beyond
