## Scenario

The user runs `/brainstorming-gh-issue 28`. Issue #28 exists and has no `pending-review` label. The `gh` CLI is authenticated.

## Expected Behaviour

- The skill parses `28` from the argument.
- No branch name lookup is performed.
- `gh issue view 28` is called to fetch the issue.
- The skill proceeds to brainstorming with issue #28 as the context.

## Pass Criteria

- [ ] The issue number `28` is resolved from the argument without calling `git branch --show-current`.
- [ ] `gh issue view 28` (or equivalent with `--json`) is called to fetch the issue.
- [ ] Brainstorming is initiated for issue #28.
