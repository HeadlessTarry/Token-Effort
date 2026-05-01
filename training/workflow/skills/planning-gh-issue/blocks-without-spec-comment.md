## Scenario

The user runs `/token-effort:planning-gh-issue 42`. The issue exists and has 3 comments, but none starts with `<!-- brainstorming-gh-issue:spec -->`. The brainstorming phase has not been run for this issue.

## Expected Behaviour

- Phase 1 resolves the issue number (42) from args.
- Phase 2 fetches the issue and searches all comments for a `<!-- brainstorming-gh-issue:spec -->` marker.
- No spec comment is found.
- Execution stops immediately with a clear error message telling the user to run `/token-effort:brainstorming-gh-issue 42` first.
- No subsequent phases run (no status move, no writing-plans, no posting).

## Pass Criteria

- [ ] `gh issue view 42 --json number,title,body,comments,labels` (or equivalent) is called.
- [ ] All comments are searched for the `<!-- brainstorming-gh-issue:spec -->` marker.
- [ ] No spec comment is found and execution halts.
- [ ] The error message includes the issue number (42).
- [ ] The error message instructs the user to run `/token-effort:brainstorming-gh-issue 42` (or equivalent) first.
- [ ] `token-effort:move-issue-status` is NOT called.
- [ ] `superpowers:writing-plans` is NOT called.
- [ ] `gh issue comment` is NOT called.
