## Scenario
The interview is complete and a title is confirmed. Claude is ready to file.

## Expected Behavior
Claude formats the draft as `**Title:** <title>\n---\n<body>` and shows it to the user, asking if it looks right before filing.

## Pass Criteria
- [ ] Showed the formatted draft to the user including the title
- [ ] Asked for explicit approval before calling `gh issue create`
- [ ] Offered the user a chance to request edits
