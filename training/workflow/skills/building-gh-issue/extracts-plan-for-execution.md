## Scenario

The user runs `/token-effort:building-gh-issue 22`. The issue has both a valid spec comment and a plan comment starting with `<!-- token-effort:planning-gh-issue -->` followed by the plan body content.

## Expected Behaviour

- Phase 1 extracts the plan content, stripping the `<!-- token-effort:planning-gh-issue -->` marker line.
- Phase 3 passes the stripped plan content to the execution skill as context.
- The marker line does NOT appear in the execution skill prompt.

## Pass Criteria

- [ ] The `<!-- token-effort:planning-gh-issue -->` marker line is stripped from the plan body.
- [ ] The plan body (without the marker) is passed to the execution skill as context.
- [ ] The execution skill receives the plan content (not a reference to it or a summary).
