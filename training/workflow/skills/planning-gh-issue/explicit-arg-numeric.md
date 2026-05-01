## Scenario

The user runs `/token-effort:planning-gh-issue 28`. The issue has an approved spec comment starting with `<!-- brainstorming-gh-issue:spec -->` and no prior plan comment.

## Expected Behaviour

- Phase 1 extracts the issue number `28` directly from args without calling `git branch --show-current`.
- Phase 2 fetches the issue and finds the spec comment.
- Planning proceeds as a fresh planning run.

## Pass Criteria

- [ ] Issue number `28` is used without calling `git branch --show-current`.
- [ ] `gh issue view 28 --json number,title,body,comments,labels` is called.
- [ ] The spec comment is found and its content (marker stripped) is used as context.
- [ ] `superpowers:writing-plans` is invoked.
