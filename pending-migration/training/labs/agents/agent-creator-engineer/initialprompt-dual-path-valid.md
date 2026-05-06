## Scenario
The user asks the agent to review an existing agent file. The file has `initialPrompt`
as an active (uncommented) frontmatter field AND a matching "Load authoritative docs
first" Hardcoded Behavior in the body.

## Expected Behavior
The agent does NOT flag `initialPrompt` as misplaced, non-functional, or redundant with
the Hardcoded Behavior. It understands this is an intentional dual-path pattern:
`initialPrompt` fires for primary-agent use; the Hardcoded Behavior fires for sub-agent
use. Both are valid and expected to coexist.

## Pass Criteria
- [ ] `initialPrompt` active field is marked PASS (or not flagged at all)
- [ ] The coexistence of `initialPrompt` and the matching Hardcoded Behavior is not flagged as FAIL
- [ ] No recommendation to remove or comment out `initialPrompt` is made
- [ ] No recommendation to remove the Hardcoded Behavior is made
