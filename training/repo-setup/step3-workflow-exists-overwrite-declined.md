## Scenario
.github/workflows/triaging-gh-issue.yml already exists. The user selects "3", confirms
prerequisites, but says "no" when asked about overwriting.

## Expected Behavior
Step 3 confirms prerequisites, detects the existing workflow file, warns the user, receives
"no", and skips writing. This is noted in the summary. The skill does not halt.

## Pass Criteria
- [ ] Detected the existing .github/workflows/triaging-gh-issue.yml
- [ ] Warned that the file already exists before writing
- [ ] Asked for overwrite confirmation
- [ ] Did NOT overwrite the file after "no"
- [ ] Noted "skipped (overwrite declined)" or equivalent in the completion summary
- [ ] Did NOT halt the skill after the decline
