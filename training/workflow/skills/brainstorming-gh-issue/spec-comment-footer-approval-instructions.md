## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the spec is posted as a GitHub comment. A human reviewer will see this comment and needs to know how to approve it.

## Expected Behaviour

- The spec comment footer includes instructions for how to approve the spec.
- The instructions reference two specific actions: removing the `pending-review` label, and moving the issue to the next status on the project board.

## Pass Criteria

- [ ] The footer includes instructions for approving the spec.
- [ ] The instructions mention removing the `pending-review` label.
- [ ] The instructions mention moving the issue to the next status on the project board.
- [ ] These instructions are human-readable and clearly actionable.
