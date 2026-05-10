## Scenario

The user runs `/brainstorming-gh-issue 28`. All five phases complete successfully: the issue is resolved, context is fetched, status is moved, brainstorming runs and the user approves the design, and Phase 5 posts the comment and applies the label.

## Expected Behaviour

- After Phase 5 finishes, the skill reports a clear completion message to the user.

## Pass Criteria

- [ ] A completion message is shown after all Phase 5 steps finish.
- [ ] The message references issue #28.
- [ ] The message confirms that the spec was posted as a comment.
- [ ] The message confirms that `pending-review` was applied.
