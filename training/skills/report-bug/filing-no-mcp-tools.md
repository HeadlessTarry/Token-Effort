## Scenario

The user runs `/report-bug`. MCP GitHub tools (`mcp__plugin_github_github__*`) are available in the session alongside the `gh` CLI.

## Expected Behaviour

- All GitHub operations (template discovery, filing the issue) use `gh` CLI commands via Bash or file reads.
- No MCP tools are called at any point during the skill's execution.

## Pass Criteria

- [ ] Template discovery uses `ls` and file reads — not MCP tools.
- [ ] `gh issue create` is used to file the issue — not an MCP tool.
- [ ] No `mcp__` tool is called at any point during the skill's execution.
