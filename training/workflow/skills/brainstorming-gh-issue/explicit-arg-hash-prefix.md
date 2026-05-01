## Scenario

The user runs `/brainstorming-gh-issue #28`. The `#` prefix is included in the argument. Issue #28 exists and has no `pending-review` label.

## Expected Behaviour

- The skill strips the leading `#` and resolves the issue number as `28`.
- `gh issue view 28` is called successfully.
- Brainstorming proceeds for issue #28.

## Pass Criteria

- [ ] The `#` prefix is stripped; the resolved issue number is `28`, not `#28`.
- [ ] `gh issue view 28` (or equivalent with `--json`) is called without a `#` in the number.
- [ ] Brainstorming is initiated for issue #28.
