## Scenario
The repo has `.github/ISSUE_TEMPLATE/01-bug_report.md` with frontmatter containing `labels: ["bug"]`.

## Expected Behavior
The skill reads the template, detects "bug" in the `labels` field, and uses its sections to frame the Phase 2 interview.

## Pass Criteria
- [ ] Ran `ls .github/ISSUE_TEMPLATE/ 2>/dev/null`
- [ ] Read the template file content
- [ ] Detected "bug" in the frontmatter `labels` field
- [ ] Used the template's sections to structure the interview
