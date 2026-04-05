## Scenario

The user runs `/brainstorming-gh-issue` with no arguments. The current branch is `feature/28-add-brainstorming-skill`. Issue #28 exists and has no `pending-review` label.

## Expected Behaviour

- The skill calls `git branch --show-current` and receives `feature/28-add-brainstorming-skill`.
- It extracts the first integer: `28`.
- Brainstorming proceeds for issue #28.

## Pass Criteria

- [ ] `git branch --show-current` is called.
- [ ] The integer `28` is extracted from `feature/28-add-brainstorming-skill`.
- [ ] `gh issue view 28` (or equivalent with `--json`) is called.
- [ ] Brainstorming is initiated for issue #28.
