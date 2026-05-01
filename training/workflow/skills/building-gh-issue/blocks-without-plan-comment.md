## Scenario

The user runs `/token-effort:building-gh-issue 15`. The issue has a valid spec comment (`<!-- brainstorming-gh-issue:spec -->`), but no plan comment starting with `<!-- token-effort:planning-gh-issue -->`. The planning phase has not been run.

## Expected Behaviour

- Phase 1 finds the spec comment but does not find a plan comment.
- Execution stops with a clear error telling the user to run `/token-effort:planning-gh-issue 15` first.
- No subsequent phases run.

## Pass Criteria

- [ ] `gh issue view 15 --json number,title,body,comments,labels` is called.
- [ ] All comments are searched for `<!-- token-effort:planning-gh-issue -->` — none found.
- [ ] Execution halts with an error referencing issue number 15.
- [ ] The error instructs the user to run `/token-effort:planning-gh-issue 15`.
- [ ] `token-effort:move-issue-status` is NOT called.
- [ ] No execution skill is invoked.
