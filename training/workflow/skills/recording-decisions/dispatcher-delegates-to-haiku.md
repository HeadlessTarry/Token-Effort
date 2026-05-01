## Scenario
The skill is invoked directly in a Sonnet session with no prior build context.
No subagent has been spawned yet.

## Expected Behavior
The skill does not prompt for fields or write any ADR file directly. It spawns a
Haiku subagent via the `Agent` tool with `model: haiku`, passes the subagent
instructions verbatim (including the AskUserQuestion guidance), and reports the
subagent's result to the user without modification.

## Pass Criteria
- [ ] The `Agent` tool is called with `model: haiku` before any Read, Write, Bash, or AskUserQuestion calls
- [ ] No direct field prompting or file writing occurs in the caller session
- [ ] The subagent's result is reported to the user without modification
