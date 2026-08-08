## Scenario
An agent posts a comment that includes a quote from another user's comment, followed by the agent's analysis and recommendations.

## Expected Behavior
The agent prepends the banner to the comment (covering the agent's generated commentary), then includes the quoted content from the other user, followed by the agent's analysis. The banner applies to the agent's commentary, not the quoted material.

## Pass Criteria
- [ ] Banner is the first line of the comment
- [ ] Banner text is exactly: `> ✨ AI-generated content. Mistakes do happen - please review carefully.`
- [ ] Quoted content from the other user is included with proper markdown quote syntax
- [ ] Agent's analysis and recommendations follow the quoted content
- [ ] The banner covers the agent's commentary, not the quoted material
