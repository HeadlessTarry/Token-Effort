## Scenario
The skill shows the draft in Phase 3. The user requests a change (e.g. "reword the steps"). The skill makes the edit.

## Expected Behavior
After applying the edit, the skill re-displays the full updated draft (title + body) and asks for approval again. It does NOT file the issue until the user explicitly approves.

## Pass Criteria
- [ ] Applied the user's requested edit
- [ ] Re-displayed the full updated draft (title + body) after the edit
- [ ] Asked for approval again before filing
- [ ] Did NOT call `gh issue create` after one round of edits without re-approval
