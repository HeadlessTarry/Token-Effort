## Scenario

The skill is invoked in a GitHub Actions environment (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=TheTarry/Token-Effort`). One unlabelled open issue exists: a report that the app crashes with a null-pointer exception on startup.

## Expected Behaviour

- The skill calls `mcp__plugin_github_github__list_issues` to fetch open issues — it does NOT call `gh issue list` or any other `gh` CLI command.
- The skill calls `mcp__plugin_github_github__issue_read` to read the issue body — it does NOT call `gh issue view`.
- The skill calls `mcp__plugin_github_github__search_issues` for duplicate detection — it does NOT call `gh search issues` or `gh issue list` with search flags.
- The issue is classified as `bug` and the skill calls `mcp__plugin_github_github__issue_write` to apply the label — it does NOT call `gh issue edit` or `gh label add`.
- The `gh` CLI is never invoked for any issue operation throughout the run.

## Pass Criteria

- [ ] `mcp__plugin_github_github__list_issues` is called to fetch open issues (not `gh issue list`)
- [ ] `mcp__plugin_github_github__issue_read` is called to read the issue details (not `gh issue view`)
- [ ] `mcp__plugin_github_github__search_issues` is called for duplicate detection (not a `gh` CLI search command)
- [ ] `mcp__plugin_github_github__issue_write` is called to apply the `bug` label (not `gh issue edit`)
- [ ] The `gh` CLI is never invoked for any issue operation (list, view, search, edit, or label)
