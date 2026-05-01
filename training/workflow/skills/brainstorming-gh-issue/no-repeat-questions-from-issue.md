## Scenario

The user runs `/brainstorming-gh-issue 28`. Issue #28 has a detailed description explaining what the feature should do, why it's needed, and the expected user experience. This information would normally prompt several of brainstorming's standard clarifying questions.

## Expected Behaviour

- The skill injects the issue content as the starting brief.
- The handoff instructions tell `superpowers:brainstorming` not to re-ask questions whose answers are already present in the issue title, body, or comments.
- Brainstorming picks up from the issue context without redundantly asking "what does this feature need to do?" or "who is the intended user?".

## Pass Criteria

- [ ] The handoff instructions explicitly tell brainstorming to treat the issue content as the starting brief.
- [ ] The instruction includes a directive not to re-ask questions already answered in the issue.
- [ ] The issue title, body, and comments are all included in the injected context.
