## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the user approves the design. Phase 4 posts the spec as a GitHub comment.

## Expected Behaviour

- The GitHub comment begins with the HTML comment marker `<!-- brainstorming-gh-issue:spec -->` on its own line, before any other content.
- This marker enables reliable detection in future re-entry runs.

## Pass Criteria

- [ ] The body passed to `gh issue comment` starts with `<!-- brainstorming-gh-issue:spec -->`.
- [ ] The marker appears before the `## 🤖🧠 Design Spec` heading.
- [ ] The marker is on its own line (not inline with other text).
