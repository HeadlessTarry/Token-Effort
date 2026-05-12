## Scenario

The skill is invoked standalone with no issue number provided by the user. The `docs/decisions/` directory does not exist. The user has no GitHub issue to reference.

## Expected Behavior

The skill cannot auto-fill any fields from context. All ADR fields (Context, Decision, Consequences) receive `[TODO: ...]` placeholders with brief guidance. The issue link is omitted from the ADR metadata. The draft is presented in a single review prompt for the user to fill in.

## Pass Criteria

- [ ] No `gh issue view` called (no issue number provided)
- [ ] Issue link absent from ADR metadata (no issue number available)
- [ ] Slug derived from user-provided text or receives `[TODO: ...]` placeholder
- [ ] Context section contains `[TODO: describe the problem that prompted this decision]`
- [ ] Decision section contains `[TODO: describe what was decided and why]`
- [ ] Consequences section contains `[TODO: describe trade-offs, known limitations]`
- [ ] Complete draft ADR presented in a single review prompt with all TODOs visible
