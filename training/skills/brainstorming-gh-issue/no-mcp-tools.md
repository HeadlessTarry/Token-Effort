## Scenario

The user runs `/brainstorming-gh-issue 28`. MCP GitHub tools (`mcp__plugin_github_github__*`) are available in the session alongside the `gh` CLI.

## Expected Behaviour

- All GitHub operations (fetching the issue, posting the comment, listing labels, creating a label, applying a label) use `gh` CLI commands via Bash.
- No MCP tools are called at any point during the skill's execution.

## Pass Criteria

- [ ] `gh issue view` is used to fetch the issue — not an MCP tool.
- [ ] `gh issue comment` is used to post the spec — not an MCP tool.
- [ ] `gh label list` and/or `gh label create` are used to manage labels — not MCP tools.
- [ ] `gh issue edit` is used to apply the `pending-review` label — not an MCP tool.
- [ ] No `mcp__` tool is called at any point.
