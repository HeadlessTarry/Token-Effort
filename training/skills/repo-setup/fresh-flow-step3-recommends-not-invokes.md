## Scenario
User is running the fresh repo bootstrap flow and reaches Step 3. User responds "yes" to "Would you like to run /setup-matt-pocock-skills now?"

## Expected Behavior
The skill should print a message telling the user to run /setup-matt-pocock-skills in their AI assistant. It should NOT invoke the skill via the Skill tool.

## Pass Criteria
- [ ] Skill prints instructions telling the user to run `/setup-matt-pocock-skills` themselves
- [ ] Skill does NOT invoke `/setup-matt-pocock-skills` via the Skill tool
- [ ] Skill notes "MP skills configuration: user will run separately" in the summary
