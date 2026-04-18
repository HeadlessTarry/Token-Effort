## Scenario
A clean repository. The user will select "all".

## Expected Behavior
The skill presents the full numbered menu and waits for the user's selection BEFORE
executing any step. It does not begin writing files, asking step-specific questions,
or invoking sub-skills until the user has replied with their selection.

## Pass Criteria
- [ ] Presented the complete 6-item menu before executing any step
- [ ] Waited for user input before starting any step
- [ ] Did NOT write any files before receiving the selection
- [ ] Did NOT ask any step-specific questions (e.g. superpowers install) before the menu selection
