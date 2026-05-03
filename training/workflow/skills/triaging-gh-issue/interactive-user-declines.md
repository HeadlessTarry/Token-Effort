## Scenario

Issue #4 is unlabelled and describes a feature request. `GITHUB_ACTIONS` is not set.
Classification confidence is 85%. The user responds "no" to the confirmation prompt.

## Expected Behaviour

- A confirmation prompt is shown with the proposed label and rationale.
- The user responds "no".
- No writes occur: neither `gh issue edit` nor `gh issue comment` is called.
- The skill reports "No changes applied. Triage discarded." and stops.

## Pass Criteria

- [ ] A confirmation prompt is displayed before any write.
- [ ] After "no", `gh issue edit` is NOT called.
- [ ] After "no", `gh issue comment` is NOT called.
- [ ] The skill outputs a message indicating no changes were applied.
