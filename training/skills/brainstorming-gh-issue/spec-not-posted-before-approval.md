## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming is underway. The user is reviewing design sections and has not yet given final approval. At this point in the session, no GitHub write operations should have occurred.

## Expected Behaviour

- Phase 4 (posting the spec comment and applying the label) only runs after the user explicitly approves the final design within the brainstorming session.
- No `gh issue comment` or `gh issue edit` call is made during or before brainstorming.

## Pass Criteria

- [ ] `gh issue comment` is not called during Phase 3 (brainstorming).
- [ ] `gh issue edit --add-label` is not called during Phase 3.
- [ ] The skill clearly separates the brainstorming phase from the GitHub action phase in its process description.
