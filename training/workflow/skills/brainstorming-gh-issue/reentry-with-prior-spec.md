## Scenario

The user runs `/brainstorming-gh-issue 15`. Issue #15 has the `pending-review` label. One of its comments begins with `<!-- brainstorming-gh-issue:spec -->` and contains a previously generated design spec. The issue also has a title, body, and other comments.

## Expected Behaviour

- The skill detects `pending-review` in the labels → enters re-entry mode.
- It searches the comments array for an entry starting with `<!-- brainstorming-gh-issue:spec -->`.
- It extracts the full body of that comment as the prior spec.
- It loads both the issue context and the prior spec into the conversation.
- It invokes `superpowers:brainstorming` as a **continuation**, informing Claude not to start from scratch.

## Pass Criteria

- [ ] The skill identifies the `pending-review` label and enters re-entry mode.
- [ ] The comment containing `<!-- brainstorming-gh-issue:spec -->` is found and its content extracted.
- [ ] Both the issue context and the prior spec are provided to brainstorming.
- [ ] Brainstorming is framed as a continuation, not a fresh start.
- [ ] The skill does NOT proceed as if no prior spec exists.
