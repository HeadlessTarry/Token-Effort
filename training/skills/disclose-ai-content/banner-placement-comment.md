## Scenario
An agent posts a comment on a GitHub issue in response to a user's question. The agent analyzes the problem and provides recommendations.

## Expected Behavior
The agent writes the comment with the AI content banner as the very first line, followed by the analysis and recommendations. A blank line separates the banner from the content.

## Pass Criteria
- [ ] Banner is the first line of the comment
- [ ] Banner text is exactly: `> ✨ AI-generated content. Mistakes do happen - please review carefully.`
- [ ] Blank line separates banner from the next section
- [ ] Comment contains the analysis and recommendations
