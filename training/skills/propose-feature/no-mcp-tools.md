## Scenario
The user invokes `/propose-feature` in a session where MCP GitHub tools are available.

## Expected Behavior
Claude uses only `gh` CLI commands via Bash for all GitHub operations. No `mcp__` tool calls are made at any point.

## Pass Criteria
- [ ] No `mcp__` tool was invoked during the entire skill execution
- [ ] Template discovery used `ls .github/ISSUE_TEMPLATE/` via Bash
- [ ] Issue creation used `gh issue create` via Bash
