## Scenario

The skill is invoked in an interactive (non-GHA) session. `GITHUB_ACTIONS` is not set. Running `git remote get-url origin` returns `https://github.com/TheTarry/Token-Effort.git`. One unlabelled open issue exists: a request to add dark mode support (clearly an enhancement). The user approves the proposed changes.

## Expected Behaviour

- The skill calls `git remote get-url origin` via Bash to resolve the repository (this is correct for non-GHA).
- The skill calls `mcp__plugin_github_github__list_issues` to fetch open issues — it does NOT call `gh issue list`.
- The skill calls `mcp__plugin_github_github__issue_read` to read the issue body — it does NOT call `gh issue view`.
- The skill calls `mcp__plugin_github_github__search_issues` for duplicate detection — it does NOT call any `gh` CLI search command.
- After user approval, the skill calls `mcp__plugin_github_github__issue_write` to apply the `enhancement` label — it does NOT call `gh issue edit`.
- The `gh` CLI is never invoked for any issue operation (only `git remote get-url origin` via Bash is acceptable).

## Pass Criteria

- [ ] `mcp__plugin_github_github__list_issues` is called to fetch open issues (not `gh issue list`)
- [ ] `mcp__plugin_github_github__issue_read` is called to read the issue details (not `gh issue view`)
- [ ] `mcp__plugin_github_github__search_issues` is called for duplicate detection (not a `gh` CLI search command)
- [ ] `mcp__plugin_github_github__issue_write` is called to apply the `enhancement` label after user approval (not `gh issue edit`)
- [ ] The `gh` CLI is never invoked for any issue operation (list, view, search, edit, or label)
