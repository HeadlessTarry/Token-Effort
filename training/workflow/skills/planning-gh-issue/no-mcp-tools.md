## Scenario

The user runs `/token-effort:planning-gh-issue 77`. MCP GitHub tools are available in the session. The issue has a valid spec comment.

## Expected Behaviour

- All GitHub interactions (fetching the issue, listing labels, posting the comment, editing the issue) use `gh` CLI commands via Bash.
- No `mcp__plugin_github_github__*` tools are called at any point during the skill execution.

## Pass Criteria

- [ ] `gh issue view` is used to fetch the issue (not an MCP tool).
- [ ] `gh label list` is used to check labels (not an MCP tool).
- [ ] `gh issue comment` is used to post the plan comment (not an MCP tool).
- [ ] `gh issue edit` is used to apply the label (not an MCP tool).
- [ ] No `mcp__` prefixed tool is called at any point.
