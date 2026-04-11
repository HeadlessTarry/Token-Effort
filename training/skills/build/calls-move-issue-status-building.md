## Scenario

The user runs `/token-effort:build 22`. The issue has a valid spec comment whose first line is `<!-- brainstorming-gh-issue:spec -->` followed by the full spec body. The issue is on a project board.

## Expected Behaviour

- Phase 1 fetches the issue, finds the spec comment, and strips the `<!-- brainstorming-gh-issue:spec -->` marker line from the body before storing the spec.
- Phase 2 calls `token-effort:move-issue-status 22 "Building"` before invoking `superpowers:writing-plans`.
- Phase 3 invokes `superpowers:writing-plans` with the stripped spec body (marker line absent).

## Pass Criteria

- [ ] `gh issue view 22 --json number,title,body,comments,labels` (or equivalent) is called.
- [ ] The spec comment is found via its `<!-- brainstorming-gh-issue:spec -->` marker.
- [ ] `token-effort:move-issue-status 22 "Building"` is called.
- [ ] `superpowers:writing-plans` is called AFTER `token-effort:move-issue-status`.
- [ ] The spec body passed to `superpowers:writing-plans` does NOT include the `<!-- brainstorming-gh-issue:spec -->` marker line.
