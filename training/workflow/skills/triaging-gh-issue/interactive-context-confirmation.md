## Scenario

Issue #3 is unlabelled and describes a request for a new dark mode setting — clearly an
enhancement with 88% confidence. `GITHUB_ACTIONS` is not set. The user is prompted and
responds "yes".

## Expected Behaviour

- The proposed label, confidence score, and one-line rationale are displayed before any
  write.
- After the user confirms, `gh issue edit --add-label enhancement` is called.
- `gh issue comment` is then called to post the triage summary.

## Pass Criteria

- [ ] A confirmation prompt shows the proposed label (`enhancement`), confidence (≥ 70%),
  and a rationale before any `gh issue edit` call.
- [ ] Neither `gh issue edit` nor `gh issue comment` is called before the user responds.
- [ ] After "yes", `gh issue edit --add-label enhancement` is called.
- [ ] `gh issue comment` is called after the label write.
