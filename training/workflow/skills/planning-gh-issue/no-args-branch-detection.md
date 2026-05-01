## Scenario

The user runs `/token-effort:planning-gh-issue` with no arguments. The current branch is `67-extract-plan-phase`. The issue has an approved spec comment.

## Expected Behaviour

- Phase 1 finds no args, so calls `git branch --show-current`.
- The first integer in the branch name (`67`) is extracted as the issue number.
- Phase 2 fetches issue 67 and proceeds normally.

## Pass Criteria

- [ ] `git branch --show-current` is called because no args were provided.
- [ ] The first integer `67` is extracted from the branch name `67-extract-plan-phase`.
- [ ] `gh issue view 67 --json number,title,body,comments,labels` is called.
- [ ] Planning proceeds without asking the user to choose a number.
