## Scenario

The skill is invoked in a GitHub Actions environment (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). The repository has 105 unlabelled open issues, all of which are clearly feature requests (enhancements). A single call to `gh issue list --limit 1000` returns all 105 issues in one response.

## Expected Behaviour

- The skill calls `gh issue list --repo HeadlessTarry/Token-Effort --state open --limit 1000 --json number,title,body,labels` exactly once.
- All 105 issues are returned in that single response and accumulated into a list before classification begins.
- No second or subsequent `gh issue list` call is made.
- The skill classifies and labels all 105 issues as `enhancement`.
- No `mcp__` tool is invoked for any operation.

## Pass Criteria

- [ ] `gh issue list` is called exactly once (no repeated or paginated calls)
- [ ] All 105 issues are classified (not just a subset)
- [ ] `gh issue edit --add-label` is called 105 times (once per issue)
- [ ] No `mcp__` tool is invoked for any issue operation
- [ ] Final report shows 105 applied, 0 reclassified, 0 unchanged, 0 failures
