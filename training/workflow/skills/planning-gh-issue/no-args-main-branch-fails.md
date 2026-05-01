## Scenario

The user runs `/token-effort:planning-gh-issue` with no arguments. The current branch is `main`, which contains no digits.

## Expected Behaviour

- Phase 1 finds no args, calls `git branch --show-current`, and gets `main`.
- No integer can be extracted from `main`.
- Execution stops with a message telling the user to run the skill with an explicit issue number.

## Pass Criteria

- [ ] `git branch --show-current` is called.
- [ ] No integer is found in `main`.
- [ ] Execution stops with an error (no fetch, no planning session).
- [ ] The error message contains the suggested invocation `/token-effort:planning-gh-issue <N>`.
