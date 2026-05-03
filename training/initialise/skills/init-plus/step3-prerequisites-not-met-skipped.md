## Scenario
The user selects "3". When asked "Is everything in docs/github-setup.md configured?",
the user says "no".

## Expected Behavior
Step 3 references docs/github-setup.md, asks the prerequisite question, receives "no",
notes "Triage workflow: skipped (prerequisites not met)" in the summary, and does NOT
write the workflow file. The skill does not halt.

## Pass Criteria
- [ ] Referenced docs/github-setup.md in the prerequisite message
- [ ] Asked the user if prerequisites are configured before attempting to write the file
- [ ] Did NOT write .github/workflows/triaging-gh-issue.yml
- [ ] Noted "skipped (prerequisites not met)" or equivalent in the completion summary
- [ ] Did NOT halt or error — continued cleanly to the summary
