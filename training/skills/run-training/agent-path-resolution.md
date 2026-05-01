## Scenario
User runs `/run-training plugins/workflow/agents/reviewer-docs.md`. The file `plugins/workflow/agents/reviewer-docs.md` exists.

## Expected Behavior
The skill parses the plugin (`workflow`), type (`agents`), and name (`reviewer-docs`) from the supplied path. It resolves the definition file to `plugins/workflow/agents/reviewer-docs.md` and the evals directory to `training/workflow/agents/reviewer-docs/`. It does not look under `claude/skills/`.

## Pass Criteria
- [ ] Resolves definition file to `plugins/workflow/agents/reviewer-docs.md`
- [ ] Resolves evals directory to `training/workflow/agents/reviewer-docs/`
- [ ] Does not look under `claude/skills/` for the definition file
