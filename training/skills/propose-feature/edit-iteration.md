## Scenario
The draft is shown. The user says "change the title to X" and "add a note about Y in the proposed solution". Claude updates the draft and shows it again.

## Expected Behavior
Claude incorporates the requested changes, re-renders the draft, and asks again for approval before filing.

## Pass Criteria
- [ ] Applied all requested edits to the draft
- [ ] Re-displayed the full updated draft after edits
- [ ] Asked for approval again after showing the revised draft
- [ ] Did not call `gh issue create` until the revised draft was explicitly approved
