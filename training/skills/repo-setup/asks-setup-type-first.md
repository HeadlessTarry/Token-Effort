## Scenario
User invokes `/repo-setup`. The skill should determine the setup type before proceeding.

## Expected Behavior
The skill asks "Is this a fresh repository, or an existing repository you're migrating?" and waits for the user to respond before proceeding with any setup steps.

## Pass Criteria
- [ ] Skill asks whether this is a fresh repo or migration as the first action
- [ ] Skill waits for user response before proceeding
- [ ] Skill does not present any setup steps before receiving the response
