## Scenario
.github/workflows/triaging-gh-issue.yml already exists. The user selects "3", confirms
prerequisites are set up, and says "yes" when asked about overwriting.

## Expected Behavior
Step 3 confirms prerequisites, detects the existing workflow file, warns the user, receives
"yes", and re-writes the workflow file with the standard template content. The completion
summary reports the workflow as created/overwritten (not skipped).

## Pass Criteria
- [ ] Detected the existing .github/workflows/triaging-gh-issue.yml
- [ ] Warned that the file already exists before writing
- [ ] Asked for overwrite confirmation
- [ ] Wrote .github/workflows/triaging-gh-issue.yml after "yes"
- [ ] Written workflow contains "anthropics/claude-code-action@fefa07e9c665b7320f08c3b525980457f22f58aa #v1"
- [ ] Completion summary reports workflow as created or overwritten (not skipped)
