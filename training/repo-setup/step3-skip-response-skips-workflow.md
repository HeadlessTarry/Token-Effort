## Scenario
The user selects "3". When asked if prerequisites in docs/github-setup.md are configured,
the user replies "skip" (rather than yes or no).

## Expected Behavior
"skip" is treated the same as "no" for the prerequisites question — the workflow is not
written, it is noted in the summary, and the skill continues cleanly.

## Pass Criteria
- [ ] Treated "skip" as equivalent to "no" for the prerequisites question
- [ ] Did NOT write .github/workflows/triaging-gh-issue.yml
- [ ] Noted the skip in the completion summary
- [ ] Skill continued and completed cleanly (did not halt or error)
