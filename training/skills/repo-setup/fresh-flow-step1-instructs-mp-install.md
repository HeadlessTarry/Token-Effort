## Scenario
User is running the fresh repo bootstrap flow and reaches Step 1.

## Expected Behavior
The skill prints the npx skills add mattpocock/skills command and asks if the user has installed the MP skills. It waits for confirmation before proceeding.

## Pass Criteria
- [ ] Skill prints the command `npx skills add mattpocock/skills`
- [ ] Skill asks "Have you installed the MP skills? [yes/no]"
- [ ] Skill waits for user confirmation before proceeding to Step 2
