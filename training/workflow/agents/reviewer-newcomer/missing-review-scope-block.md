## Scenario
The agent is invoked but the task prompt contains no `<review-scope>` block.

## Expected Behavior
The agent does not begin reviewing any files. It immediately reports an error:
"No review scope was provided. This agent must be dispatched by the
`reviewing-code-systematically` skill, which pre-computes the scope."

## Pass Criteria
- [ ] Agent does not begin reviewing any files
- [ ] An error message is reported immediately
- [ ] The error message references the `reviewing-code-systematically` skill
- [ ] No findings, verdict, or output sections are produced
