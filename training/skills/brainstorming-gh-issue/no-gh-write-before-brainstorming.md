## Scenario

The user runs `/brainstorming-gh-issue 28`. The issue is fetched, context is detected, and Phase 4 begins. The session is still in the brainstorming interactive loop — the user has not yet approved any design.

## Expected Behaviour

- During Phase 4 (the brainstorming session), no GitHub write operations occur.
- Specifically: `gh issue comment` is NOT called, `gh issue edit` is NOT called, and `gh label create` is NOT called.
- The skill waits for the user to explicitly approve the design within the brainstorming session before proceeding to Phase 5.
- Phase 5 is the only phase that performs GitHub writes, and it runs only after approval.

## Pass Criteria

- [ ] `gh issue comment` is NOT called during Phase 4.
- [ ] `gh issue edit` is NOT called during Phase 4.
- [ ] `gh label create` is NOT called during Phase 4.
- [ ] The skill's Phase 4 handoff instructions make clear that Phase 5 runs only after user approval.
- [ ] The skill does not post the spec or apply the label until the user has explicitly approved the design.
