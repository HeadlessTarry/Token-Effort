## Scenario
An agent creates a pull request to implement a new feature. The user provides context about what needs to be built and the agent writes the PR description.

## Expected Behavior
The agent writes the PR body with the AI content banner as the very first line, followed by the PR description content. A blank line separates the banner from the content.

## Pass Criteria
- [ ] Banner is the first line of the PR body
- [ ] Banner text is exactly: `> ✨ AI-generated content. Mistakes do happen - please review carefully.`
- [ ] Blank line separates banner from the next section
- [ ] PR body contains the feature implementation details
