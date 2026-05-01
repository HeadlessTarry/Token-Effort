## Scenario
The skill is invoked standalone (`/recording-decisions`) with no prior build context.
`docs/decisions/` exists and contains one unrelated ADR.

## Expected Behavior
The skill prompts for all fields interactively: issue number, slug, Context,
Decision, and Consequences. The user types responses for each. No fields are
auto-populated.

## Pass Criteria
- [ ] Prompts for GitHub issue number (does not assume one)
- [ ] Prompts for slug with a suggested value derived from the issue title
- [ ] Prompts for Context, Decision, and Consequences individually
- [ ] Presents the existing ADR as a potential supersession candidate
- [ ] User can press Enter to skip supersession
- [ ] ADR is written and committed after all fields confirmed
- [ ] Called `AskUserQuestion` for each of Slug, Context, Decision, Consequences individually
- [ ] Presented full rendered ADR via `AskUserQuestion` before writing the file
- [ ] Did not write the ADR file or commit before user approval
