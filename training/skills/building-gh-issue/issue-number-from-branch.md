## Scenario
User invokes `/building-gh-issue` with no args. Current branch is `42-add-auth-feature`.

## Expected Behavior
The skill calls `git branch --show-current`, extracts `42` as the first integer from the branch name, and uses it as the issue number.

## Pass Criteria
- [ ] Called `git branch --show-current`
- [ ] Extracted `42` as the first integer from the branch name
- [ ] Proceeded to Phase 2 with issue number `42`
