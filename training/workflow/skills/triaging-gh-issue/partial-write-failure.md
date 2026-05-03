## Scenario

Issue #9 is unlabelled and clearly describes a bug. `GITHUB_ACTIONS=true`,
`GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`. Classification confidence is 90%.
When `gh issue edit --add-label bug` is called, it returns a 403 Forbidden error.

## Expected Behaviour

- The skill attempts to apply the label and reports the failure.
- Despite the label write failing, the skill still attempts to post the triage comment.
- The failure is referenced in the final triage output.

## Pass Criteria

- [ ] `gh issue edit --add-label bug` is called and the 403 error is reported.
- [ ] `gh issue comment` is still called after the label write fails.
- [ ] The triage output references the write failure.
