## Scenario

The skill is invoked with the argument `#42` (with a leading `#`). The `GITHUB_ACTIONS`
environment variable is not set.

## Expected Behaviour

- The skill extracts `42` from the argument by stripping the `#` prefix.
- `gh issue view 42` is called immediately without calling `git branch --show-current`.

## Pass Criteria

- [ ] The issue number `42` is resolved from the argument, with `#` stripped.
- [ ] `gh issue view 42` is called.
- [ ] `git branch --show-current` is NOT called.
