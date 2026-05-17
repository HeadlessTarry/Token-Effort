## Scenario
User invokes `/building-gh-issue` with no args. Current branch is `main`.

## Expected Behavior
The skill calls `git branch --show-current`, finds no digits, and stops with a message suggesting the user run `/building-gh-issue <N>`.

## Pass Criteria
- [ ] Called `git branch --show-current`
- [ ] Found no digits in branch name
- [ ] Stopped with a message containing `/building-gh-issue <N>`
