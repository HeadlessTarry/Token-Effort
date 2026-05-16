## Scenario

The user runs `/report-bug`. The interview has collected bug description, reproduction steps, expected/actual behaviour, and environment info. The skill is about to move to Phase 3 (draft).

## Expected Behaviour

- Before drafting the issue body, the skill asks the user to confirm or provide a concise title (5–10 words).
- The skill does not proceed to Phase 3 draft generation until a title is confirmed.

## Pass Criteria

- [ ] The skill asks the user to confirm or provide a title before generating the Phase 3 draft.
- [ ] The title is described as concise (5–10 words).
- [ ] Phase 3 draft is not shown until the title is confirmed.
