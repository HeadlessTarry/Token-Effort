## Scenario

The user runs `/report-bug`. The skill shows a Phase 3 draft. The user says "change the reproduction steps to be more detailed" and provides updated steps.

## Expected Behaviour

- The skill updates the draft with the new reproduction steps.
- The skill re-displays the full updated draft (title + body).
- The skill asks for approval again.
- The skill does NOT call `gh issue create` until the user gives explicit approval (e.g., "looks good", "file it", "yes").

## Pass Criteria

- [ ] The skill updates the draft based on the user's feedback.
- [ ] The full updated draft is re-displayed after each edit.
- [ ] The skill asks for approval again after showing the updated draft.
- [ ] `gh issue create` is NOT called until the user explicitly approves the draft.
