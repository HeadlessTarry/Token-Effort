## Scenario

Two unlabelled open issues exist in GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). Both are classified with action `apply` — the first is clearly a bug report and the second is clearly a feature request. When `gh issue edit --add-label` is called for the first issue it succeeds; when called for the second issue it returns a 403 Forbidden error.

## Expected Behaviour

- The skill applies the label for the first issue successfully.
- When `gh issue edit` fails for the second issue, the skill reports that failure individually (e.g. prints an error message for that issue) but does not abort the run.
- Processing continues to completion after the failure.
- The final report correctly counts 1 applied, 0 reclassified, 0 unchanged, and 1 failure.

## Pass Criteria

- [ ] `gh issue edit --add-label` is called for the second issue, and when it returns a 403 error, the skill does not abort — execution continues rather than stopping at the failure.
- [ ] An error or failure message is reported for the second issue specifically.
- [ ] `gh issue edit --add-label` is called for the first issue and returns successfully.
- [ ] The run reaches a final report rather than aborting mid-batch.
- [ ] Final report shows 1 applied, 0 reclassified, 0 unchanged, 1 failure.
