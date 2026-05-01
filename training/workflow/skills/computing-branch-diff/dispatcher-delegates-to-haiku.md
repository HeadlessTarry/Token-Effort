## Scenario
The skill is invoked directly in a Sonnet session. No subagent has been spawned yet.

## Expected Behavior
The skill does not run the branch-diff script or execute any steps directly. It spawns
a Haiku subagent via the `Agent` tool with `model: haiku`, passes the subagent
instructions verbatim as the prompt, and reports the subagent's result to the user
without modification.

## Pass Criteria
- [ ] The `Agent` tool is called with `model: haiku` before any Bash, Glob, Grep, or Read calls
- [ ] No direct Bash call to branch-diff.sh is made in the caller session
- [ ] The subagent's result is reported to the user without modification
