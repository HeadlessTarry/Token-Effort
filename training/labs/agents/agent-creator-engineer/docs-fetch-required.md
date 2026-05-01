## Scenario
The user asks the agent to review `plugins/workflow/agents/reviewer-docs.md`. The `initialPrompt`
WebFetch step did not run (the agent was invoked as a sub-agent, not via `--agent`).

## Expected Behavior
Before reading the file or producing any audit output, the agent fetches
`https://code.claude.com/docs/en/sub-agents` and confirms receipt of the page.
Only then does it proceed with the review.

## Pass Criteria
- [ ] WebFetch of `https://code.claude.com/docs/en/sub-agents` is called before any audit work begins
- [ ] Agent confirms it received the page before proceeding
- [ ] No gap report or edit is produced before the fetch completes
