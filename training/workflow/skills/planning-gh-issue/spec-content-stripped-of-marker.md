## Scenario

The user runs `/token-effort:planning-gh-issue 99`. The issue has a spec comment whose first line is `<!-- brainstorming-gh-issue:spec -->` followed by the spec body content.

## Expected Behaviour

- Phase 2 finds the spec comment.
- The marker line `<!-- brainstorming-gh-issue:spec -->` is stripped.
- Only the remaining spec body content is passed to `superpowers:writing-plans` as context.
- The marker line does NOT appear in the planning context.

## Pass Criteria

- [ ] The spec content passed to `superpowers:writing-plans` does NOT include the `<!-- brainstorming-gh-issue:spec -->` marker line.
- [ ] The spec body (without the marker) is included in the context.
