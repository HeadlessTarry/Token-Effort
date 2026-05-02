## Scenario
The user selects "1 3". Steps 2, 4, and 5 are not selected.

## Expected Behavior
Only Steps 1 and 3 execute. Steps 2, 4, and 5 are completely skipped — no prompts,
no messages, no actions are taken for them. The completion summary covers only Steps 1 and 3.

## Pass Criteria
- [ ] Executed Step 1 (CLAUDE.md)
- [ ] Executed Step 3 (workflow, assuming prerequisites confirmed)
- [ ] Did NOT print the superpowers recommendation (Step 2 not selected)
- [ ] Did NOT write any issue template files (Step 4 not selected)
- [ ] Did NOT invoke token-effort-initialise:configuring-dependabot (Step 5 not selected)
- [ ] Did NOT execute Step 6 (not selected — no /verify commands asked, no SKILL.md written)
- [ ] Completion summary mentions only Steps 1 and 3
