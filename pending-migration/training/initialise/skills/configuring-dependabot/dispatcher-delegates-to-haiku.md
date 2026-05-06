## Scenario
The skill is invoked directly in a Sonnet session. The repository contains a package.json.
No subagent has been spawned yet.

## Expected Behavior
The skill does not scan for ecosystems or write any files directly. It spawns a Haiku
subagent via the `Agent` tool with `model: haiku`, passes the subagent instructions
verbatim (including the AskUserQuestion guidance), and reports the subagent's result
to the user without modification.

## Pass Criteria
- [ ] The `Agent` tool is called with `model: haiku` before any Glob, Grep, Read, or Write calls
- [ ] No direct ecosystem scanning or file writing occurs in the caller session
- [ ] The subagent's result is reported to the user without modification
