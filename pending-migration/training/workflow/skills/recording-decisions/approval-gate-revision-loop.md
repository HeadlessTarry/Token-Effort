## Scenario

The user invokes `/token-effort-workflow:recording-decisions` standalone. After all fields are
collected and Phase 3 completes, the skill presents the full rendered ADR. The user replies
`change the Consequences section to mention migration cost`. The skill applies the change
and presents the revised ADR again. The user replies `yes`.

## Expected Behavior

On the first `AskUserQuestion` at the approval gate, the user requests a change. The skill
applies the change to the Consequences text, re-assembles the full ADR draft (all sections
updated), and calls `AskUserQuestion` again with the revised ADR. It waits for `yes` before
writing any file or committing.

## Pass Criteria

- [ ] First approval `AskUserQuestion` called with original ADR draft
- [ ] After change request: Consequences text updated to mention migration cost
- [ ] Second `AskUserQuestion` called with revised full ADR (all sections present, updated Consequences visible)
- [ ] No file written or committed between first and second `AskUserQuestion`
- [ ] After second `yes`: ADR file written and committed with revised Consequences
