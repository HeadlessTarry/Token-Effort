## Scenario
User invokes `/building-gh-issue 42`.

## Expected Behavior
The skill extracts `42` as the issue number, strips any `#` prefix if present, and does NOT call `git branch --show-current`.

## Pass Criteria
- [ ] Resolved issue number `42` from the argument
- [ ] Did not call `git branch --show-current`
- [ ] Proceeded to Phase 2 with the resolved number
