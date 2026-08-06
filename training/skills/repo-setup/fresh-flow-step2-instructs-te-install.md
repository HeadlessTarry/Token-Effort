## Scenario
User is running the fresh repo bootstrap flow and reaches Step 2.

## Expected Behavior
The skill prints the npx skills add HeadlessTarry/Token-Effort command and asks if the user has installed the Token-Effort skills. It waits for confirmation before proceeding.

## Pass Criteria
- [ ] Skill prints the command `npx skills add HeadlessTarry/Token-Effort`
- [ ] Skill asks "Have you installed the Token-Effort skills? [yes/no]"
- [ ] Skill waits for user confirmation before proceeding to Step 3
