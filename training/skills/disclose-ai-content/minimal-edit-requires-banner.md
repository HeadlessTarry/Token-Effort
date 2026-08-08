## Scenario
An agent fixes a typo in an existing GitHub issue body. The original issue was written by a human and does not have the AI content banner.

## Expected Behavior
Even though this is a minimal edit (just fixing a typo), the agent applies the AI content banner because the content has been AI-edited. The banner is prepended to the issue body.

## Pass Criteria
- [ ] Banner is the first line of the issue body after the edit
- [ ] Banner text is exactly: `> ✨ AI-generated content. Mistakes do happen - please review carefully.`
- [ ] The typo is fixed in the content
- [ ] The rest of the original content is preserved
