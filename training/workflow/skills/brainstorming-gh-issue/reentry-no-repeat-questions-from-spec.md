## Scenario

The user runs `/brainstorming-gh-issue 15` in re-entry mode. A prior spec comment is found and loaded. The prior spec already documents several design decisions and answers several questions that were resolved in the first brainstorming session.

## Expected Behaviour

- The prior spec is loaded as additional context alongside the issue.
- The handoff instructions tell `superpowers:brainstorming` not to re-ask questions whose answers already appear in either the issue or the prior spec.
- The continuation builds on the existing spec rather than restarting from scratch.

## Pass Criteria

- [ ] The prior spec content is included in the context provided to `superpowers:brainstorming`.
- [ ] The handoff instructions explicitly state not to re-ask questions already answered in the prior spec.
- [ ] The brainstorming session is framed as a continuation, not a fresh design.
