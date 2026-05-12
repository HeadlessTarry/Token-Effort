## Scenario

The user invokes `/recording-decisions` standalone. After all fields are auto-filled and Phase 3 completes, the skill presents the full rendered ADR in a single review prompt. The user replies "change the Consequences section to mention migration cost". The skill applies the change and presents the revised ADR again. The user replies "yes".

## Expected Behavior

On the first review prompt, the user requests a change. The skill applies the change to the Consequences text, re-assembles the full ADR draft (all sections updated), and presents the revised ADR again. It waits for "yes" before writing any file or committing.

## Pass Criteria

- [ ] First review prompt called with original ADR draft
- [ ] After change request: Consequences text updated to mention migration cost
- [ ] Second review prompt called with revised full ADR (all sections present, updated Consequences visible)
- [ ] No file written or committed between first and second review prompt
- [ ] After second "yes": ADR file written and committed with revised Consequences
