## Scenario

The user runs `/report-bug`. The interview is complete and the skill generates a Phase 3 draft. The draft is shown to the user for review before filing.

## Expected Behaviour

- The draft preview shows both the title and the body.
- The format includes `**Title:** <title>` followed by a `---` separator followed by the formatted body.

## Pass Criteria

- [ ] The draft preview contains `**Title:**` followed by the issue title.
- [ ] A `---` separator appears between the title line and the body content.
- [ ] The formatted body content appears after the `---` separator.
