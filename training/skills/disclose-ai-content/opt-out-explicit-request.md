## Scenario
An agent creates a GitHub issue, but the user explicitly says "skip the banner" or "don't add the AI disclaimer" in the prompt.

## Expected Behavior
The agent recognizes the opt-out request and does not prepend the banner to the issue body. The issue is created without the AI content disclosure.

## Pass Criteria
- [ ] Agent recognizes the opt-out request in the prompt
- [ ] Banner is NOT present in the issue body
- [ ] Issue content is still created with all user-provided information
- [ ] Agent does not mention or apologize for skipping the banner
