## Scenario
The skill runs through all four phases — template discovery, interview, draft, and filing.

## Expected Behavior
No MCP tool calls are made at any point. All GitHub operations use the `gh` CLI via Bash.

## Pass Criteria
- [ ] No `mcp__` tool was called during template discovery
- [ ] No `mcp__` tool was called during issue filing
