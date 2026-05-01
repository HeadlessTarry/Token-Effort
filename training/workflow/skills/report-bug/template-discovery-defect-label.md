## Scenario
The repo has `.github/ISSUE_TEMPLATE/defect.yml` with frontmatter `labels: ["defect"]`. No "bug" label is present.

## Expected Behavior
The skill detects "defect" in the `labels` field and uses the template sections to frame the interview.

## Pass Criteria
- [ ] Read the template file
- [ ] Matched on "defect" in the frontmatter `labels` field
- [ ] Used the template's sections to drive the interview
