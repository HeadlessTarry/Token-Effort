## Scenario

The user runs `/brainstorming-gh-issue` with no arguments. The current branch is `main`, which contains no digits.

## Expected Behaviour

- The skill calls `git branch --show-current` and receives `main`.
- No integer is found in the branch name.
- The skill stops with a clear, actionable error message telling the user how to provide the issue number explicitly.

## Pass Criteria

- [ ] `git branch --show-current` is called.
- [ ] The skill does not attempt to fetch any GitHub issue.
- [ ] Execution stops with a message containing the suggested invocation form `/brainstorming-gh-issue <N>`.
- [ ] `gh issue view` is never called.
