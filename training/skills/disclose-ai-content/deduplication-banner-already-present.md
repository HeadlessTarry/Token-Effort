## Scenario
An agent edits an existing GitHub issue that already has the AI content banner at the top. The user asks the agent to add more information to the issue.

## Expected Behavior
The agent checks the first 5 lines of the existing content, finds the banner is already present, and does not add it again. The agent updates the issue content without duplicating the banner.

## Pass Criteria
- [ ] Agent checks the first 5 lines of existing content
- [ ] Agent identifies that the banner is already present
- [ ] Agent does not add a duplicate banner
- [ ] Issue content is updated with the new information
- [ ] Only one instance of the banner exists in the final content
