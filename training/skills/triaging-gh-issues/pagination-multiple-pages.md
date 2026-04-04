## Scenario

The skill is invoked in a GitHub Actions environment (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=TheTarry/Token-Effort`). The repository has 105 unlabelled open issues, all of which are clearly feature requests (enhancements). The first call to `mcp__plugin_github_github__list_issues` returns 100 issues with `pageInfo.hasNextPage = true` and `pageInfo.endCursor = "cursor_abc123"`. A second call with `after = "cursor_abc123"` returns the remaining 5 issues with `pageInfo.hasNextPage = false`.

## Expected Behaviour

- The skill calls `mcp__plugin_github_github__list_issues` a first time and receives 100 issues plus pagination info indicating there are more.
- Detecting `hasNextPage = true`, the skill calls `mcp__plugin_github_github__list_issues` again with `after` set to the returned `endCursor`.
- The second call returns 5 more issues with `hasNextPage = false`, ending pagination.
- All 105 issues are accumulated into a single list before classification begins.
- The skill classifies and labels all 105 issues as `enhancement`.
- The `gh` CLI is never invoked for any operation.

## Pass Criteria

- [ ] `mcp__plugin_github_github__list_issues` is called at least twice (paginating until `hasNextPage = false`)
- [ ] The second `list_issues` call includes `after` set to the `endCursor` value from the first response
- [ ] All 105 issues are classified (not just the first 100)
- [ ] `mcp__plugin_github_github__issue_write` is called 105 times (once per issue)
- [ ] The `gh` CLI is never invoked for any issue operation
- [ ] Final report shows 105 applied, 0 reclassified, 0 unchanged, 0 failures
