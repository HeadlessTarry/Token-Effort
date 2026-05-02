## Scenario

The user runs `/token-effort-workflow:building-gh-issue 15`. The issue exists and has 2 comments, but neither comment starts with `<!-- brainstorming-gh-issue:spec -->`. No spec has been produced for this issue yet.

## Expected Behaviour

- Phase 1 fetches the issue and searches all comments for a `<!-- brainstorming-gh-issue:spec -->` marker.
- No comment with that marker is found.
- Execution stops immediately with a clear error message telling the user to run `/token-effort-workflow:brainstorming-gh-issue 15` first.
- No subsequent phases (move-issue-status, execution skill, etc.) run.

## Pass Criteria

- [ ] `gh issue view 15 --json number,title,body,comments,labels` (or equivalent) is called.
- [ ] All comments are searched for the `<!-- brainstorming-gh-issue:spec -->` marker.
- [ ] No spec comment is found and execution halts.
- [ ] The error message includes the issue number (15).
- [ ] The error message instructs the user to run `/token-effort-workflow:brainstorming-gh-issue 15` (or equivalent brainstorming step) first.
- [ ] `token-effort-workflow:move-issue-status` is NOT called.
- [ ] No execution skill is invoked.
