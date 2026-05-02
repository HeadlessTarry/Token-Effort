## Scenario

The user runs `/token-effort-workflow:planning-gh-issue 33`. After the user approves the plan, Phase 4 posts the plan as a GitHub comment.

## Expected Behaviour

- The comment body starts with `<!-- token-effort-workflow:planning-gh-issue -->` on its own line.
- The comment contains the heading `## 🤖📋 Implementation Plan`.
- The footer includes "Please review carefully before approving."
- The footer instructs the user to remove the `pending-review` label and advance the project status.

## Pass Criteria

- [ ] The comment body begins with `<!-- token-effort-workflow:planning-gh-issue -->` as the very first line.
- [ ] The comment contains `## 🤖📋 Implementation Plan` as a heading.
- [ ] The footer contains the phrase "Please review carefully before approving."
- [ ] The footer contains instructions to remove the `pending-review` label.
- [ ] The footer contains instructions to advance the issue to the next project board status.
