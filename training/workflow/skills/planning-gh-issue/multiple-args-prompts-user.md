## Scenario

The user runs `/token-effort:planning-gh-issue 28 35`. Two issue numbers are provided as arguments.

## Expected Behaviour

- Phase 1 detects multiple issue numbers in args.
- The skill asks the user to choose exactly one number before fetching anything.
- No issue is fetched until the user responds.

## Pass Criteria

- [ ] Both numbers (28 and 35) are detected in args.
- [ ] The user is asked to choose one before any `gh issue view` call is made.
- [ ] `gh issue view` is NOT called until the user selects a number.
- [ ] `git branch --show-current` is NOT called (args were provided).
