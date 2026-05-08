## Scenario
User runs `/run-training agents/reviewer-docs.md`. The file `agents/reviewer-docs.md` exists.

## Expected Behavior
The skill parses the type (`agents`) and name (`reviewer-docs`) from the supplied path. It resolves the definition file to `agents/reviewer-docs.md` and the evals directory to `training/agents/reviewer-docs/`.

## Pass Criteria
- [ ] Resolves definition file to `agents/reviewer-docs.md`
- [ ] Resolves evals directory to `training/agents/reviewer-docs/`
