## Scenario

The user runs `/brainstorming-gh-issue 28`. All four phases complete successfully: the issue is resolved, context is fetched, brainstorming runs and the user approves the design, and Phase 4 posts the comment and applies the label.

## Expected Behaviour

- After Phase 4 finishes, the skill reports a clear completion message to the user.
- The message references the issue number and confirms the spec was posted and the label applied.

## Pass Criteria

- [ ] A completion message is shown after all Phase 4 steps finish.
- [ ] The message references issue #28.
- [ ] The message confirms that the spec was posted as a comment.
- [ ] The message confirms that `pending-review` was applied.
