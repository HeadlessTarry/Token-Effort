## Scenario

The user runs `/brainstorming-gh-issue` with no arguments. The current branch is `28-29-migrate-auth`. The branch name contains two integers.

## Expected Behaviour

- The skill calls `git branch --show-current` and receives `28-29-migrate-auth`.
- It extracts the **first** integer found: `28`.
- It does NOT ask the user to choose because only one candidate (the first number) is taken from the branch name.
- Brainstorming proceeds for issue #28.

## Pass Criteria

- [ ] The integer `28` is used, not `29`.
- [ ] The skill does not ask the user to choose between `28` and `29`.
- [ ] `gh issue view 28` (or equivalent with `--json`) is called.
- [ ] Brainstorming is initiated for issue #28.
