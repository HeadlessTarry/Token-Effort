## Scenario
The user runs `/triaging-gh-issues`. There are 3 unlabelled open issues: #50, #51, #52.
Classification completes and the user approves. During Phase 6, the `issue_write` call
for #51 returns an error (e.g. "403 Forbidden"). The calls for #50 and #52 succeed.

## Expected Behavior
The skill reports the failure for #51 individually, continues to apply the label to #52,
and includes a "Failed: #51 (reason)" line in the final report alongside the successful
applications. It does NOT abort the batch when #51 fails.

## Pass Criteria
- [ ] `issue_write` was called for #50 and succeeded
- [ ] `issue_write` was called for #51 and the failure was caught and reported
- [ ] `issue_write` was called for #52 after #51's failure (batch not aborted)
- [ ] The final report included both successful label lines and a failure line for #51
- [ ] The total count in the final report reflected only the successfully applied labels
