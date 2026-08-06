## Scenario
User is running either the fresh or migration flow. At some point, the skill recommends /setup-matt-pocock-skills.

## Expected Behavior
The skill should recommend /setup-matt-pocock-skills but should NEVER invoke it via the Skill tool. It should only tell the user to run it themselves.

## Pass Criteria
- [ ] Skill never invokes /setup-matt-pocock-skills via the Skill tool
- [ ] Skill only prints instructions telling the user to run it themselves
- [ ] This applies to both fresh flow (Step 3) and migration flow (Step 6)
