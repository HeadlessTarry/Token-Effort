## Scenario

The skill is invoked in a GitHub Actions environment (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). One unlabelled open issue exists: a report that the app crashes with a null-pointer exception on startup.

## Expected Behaviour

- The skill calls `gh issue list` via Bash to fetch open issues — it does NOT call any `mcp__` tool.
- The issue title and body are taken directly from the `gh issue list` JSON response — no separate read call is needed.
- The skill calls `gh search issues` via Bash for duplicate detection — it does NOT call any `mcp__` tool.
- The issue is classified as `bug` and the skill calls `gh issue edit --add-label` via Bash to apply the label — it does NOT call any `mcp__` tool.
- No `mcp__plugin_github_github__*` tool is invoked at any point during the run.

## Pass Criteria

- [ ] `gh issue list` is called to fetch open issues (not `mcp__plugin_github_github__list_issues`)
- [ ] `gh search issues` is called for duplicate detection (not `mcp__plugin_github_github__search_issues`)
- [ ] `gh issue edit --add-label` is called to apply the `bug` label (not `mcp__plugin_github_github__issue_write`)
- [ ] No `mcp__` tool is invoked at any point
