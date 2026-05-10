## Scenario

The user runs `/planning-gh-issue 30`. The issue has a spec comment starting with `<!-- brainstorming-gh-issue:spec -->` but no prior plan comment starting with `<!-- planning-gh-issue:plan -->`.

## Expected Behaviour

- Phase 2 finds the spec comment and confirms there is no prior plan comment.
- Phase 3 proceeds as a fresh planning run (no prior plan context is loaded).
- `writing-plans` is invoked with the issue context and spec content only.

## Pass Criteria

- [ ] The spec comment is found and its content (marker line stripped) is used as context.
- [ ] All comments are searched for `<!-- planning-gh-issue:plan -->` — none found.
- [ ] `writing-plans` is invoked with fresh context (no prior plan section).
- [ ] The context passed to writing-plans includes the issue title, body, and spec content.
- [ ] No "Prior Implementation Plan" section is included in the context.
