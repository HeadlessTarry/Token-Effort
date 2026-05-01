## Scenario

The user runs `/token-effort:building-gh-issue 22`. The issue has a valid spec comment whose first line is `<!-- brainstorming-gh-issue:spec -->` followed by the full spec body, and a valid plan comment whose first line is `<!-- token-effort:planning-gh-issue -->` followed by the plan body. The issue is on a project board.

## Expected Behaviour

- Phase 1 fetches the issue, finds both the spec and plan comments, and strips their respective marker lines.
- Phase 2 calls `token-effort:move-issue-status 22 "Building"` before Phase 4 begins.
- Phase 4 invokes the execution skill with the stripped plan body as context.

## Pass Criteria

- [ ] `gh issue view 22 --json number,title,body,comments,labels` (or equivalent) is called.
- [ ] The spec comment is found via its `<!-- brainstorming-gh-issue:spec -->` marker.
- [ ] The plan comment is found via its `<!-- token-effort:planning-gh-issue -->` marker.
- [ ] `token-effort:move-issue-status 22 "Building"` is called in Phase 2.
- [ ] The execution skill is invoked in Phase 4 AFTER `token-effort:move-issue-status`.
- [ ] The plan body passed to the execution skill does NOT include the `<!-- token-effort:planning-gh-issue -->` marker line.
