## Scenario
The agent is invoked but the task prompt contains no `<review-scope>` block.

## Expected Behavior
The agent does not attempt to review any files. It reports an error:
"No review scope was provided. This agent must be dispatched by the
`reviewing-code-systematically` skill, which pre-computes the scope."

## Pass Criteria
- [ ] Agent does not begin reviewing any files
- [ ] An error message is reported immediately
- [ ] The error message references the `reviewing-code-systematically` skill
- [ ] No findings, verdict, or cross-reference results are produced
