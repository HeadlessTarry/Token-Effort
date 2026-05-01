## Scenario

The user runs `/brainstorming-gh-issue` with no arguments. The current branch is `28-some-feature`. Issue #28 exists and has no `pending-review` label.

## Expected Behaviour

- The skill calls `git branch --show-current` and receives `28-some-feature`.
- It extracts the first integer from the branch name: `28`.
- `gh issue view 28` is called to fetch the issue.
- Brainstorming proceeds for issue #28.

## Pass Criteria

- [ ] `git branch --show-current` is called to determine the branch name.
- [ ] The integer `28` is extracted from `28-some-feature`.
- [ ] `gh issue view 28` (or equivalent with `--json`) is called.
- [ ] Brainstorming is initiated for issue #28.
