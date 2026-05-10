## Scenario

The user runs `/planning-gh-issue 44`. The issue has both a spec comment (`<!-- brainstorming-gh-issue:spec -->`) and a prior plan comment (`<!-- planning-gh-issue:plan -->`). The `pending-review` label is currently applied.

## Expected Behaviour

- Phase 2 finds the spec comment and the prior plan comment.
- Re-entry mode is activated: the prior plan body (marker line stripped) is loaded as additional context.
- Phase 3 invokes `writing-plans` with issue context, spec content, AND prior plan content.
- After the user approves the updated plan, Phase 4 posts a NEW comment (does not edit the old one).

## Pass Criteria

- [ ] The prior plan comment starting with `<!-- planning-gh-issue:plan -->` is found.
- [ ] The prior plan content (marker stripped) is extracted.
- [ ] A "Prior Implementation Plan" section is included in the context passed to `writing-plans`.
- [ ] `writing-plans` is invoked (not re-implemented inline).
- [ ] Phase 4 posts a NEW comment — `gh issue comment` is called (not a comment edit).
- [ ] The new comment starts with `<!-- planning-gh-issue:plan -->`.
