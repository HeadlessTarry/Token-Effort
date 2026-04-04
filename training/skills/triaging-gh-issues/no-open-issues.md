## Scenario

The skill is invoked in a GitHub Actions environment (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=TheTarry/Token-Effort`). The call to `mcp__plugin_github_github__list_issues` returns an empty array — there are no open issues in the repository.

## Expected Behaviour

- The skill calls `mcp__plugin_github_github__list_issues` with `state: open`.
- The response is an empty list (zero issues).
- The skill reports "No open issues found." and stops immediately.
- `mcp__plugin_github_github__issue_read` is never called (no issues to read).
- `mcp__plugin_github_github__issue_write` is never called.
- No summary table is displayed and no confirmation is requested.

## Pass Criteria

- [ ] `mcp__plugin_github_github__list_issues` is called exactly once
- [ ] Execution stops after receiving an empty issue list
- [ ] The output includes "No open issues found." (or equivalent message)
- [ ] `mcp__plugin_github_github__issue_read` is never called
- [ ] `mcp__plugin_github_github__issue_write` is never called
