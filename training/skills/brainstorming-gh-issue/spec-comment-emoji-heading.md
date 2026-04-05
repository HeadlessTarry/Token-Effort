## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the user approves the design. Phase 4 posts the spec as a GitHub comment.

## Expected Behaviour

- The spec comment contains the heading `## 🤖🧠 Design Spec` immediately after the HTML marker.
- The approved design content follows under this heading.

## Pass Criteria

- [ ] The spec comment contains the exact heading `## 🤖🧠 Design Spec`.
- [ ] The heading includes both the robot (`🤖`) and brain (`🧠`) emoji.
- [ ] The heading uses `##` (h2) level.
- [ ] The approved design content appears after this heading.
