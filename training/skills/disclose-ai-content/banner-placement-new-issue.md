## Scenario
An agent creates a new GitHub issue to report a bug. The user provides a description of the problem, reproduction steps, and expected behavior.

## Expected Behavior
The agent writes the issue body with the AI content banner as the very first line, followed by the formatted issue content. A blank line separates the banner from the content.

## Pass Criteria
- [ ] Banner is the first line of the issue body
- [ ] Banner text is exactly: `> ✨ AI-generated content. Mistakes do happen - please review carefully.`
- [ ] Blank line separates banner from the next section
- [ ] Issue body contains all user-provided information (description, reproduction steps, expected behavior)
