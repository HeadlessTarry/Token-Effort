## Scenario

The user runs `/token-effort:planning-gh-issue #55`. The issue has an approved spec comment and no prior plan comment.

## Expected Behaviour

- Phase 1 strips the leading `#` and resolves the issue number as `55`.
- Phase 2 fetches the issue using number `55`.
- Planning proceeds normally.

## Pass Criteria

- [ ] The `#` prefix is stripped and `55` is used as the issue number.
- [ ] `gh issue view 55 --json number,title,body,comments,labels` is called (not `gh issue view #55`).
- [ ] Planning proceeds without error.
