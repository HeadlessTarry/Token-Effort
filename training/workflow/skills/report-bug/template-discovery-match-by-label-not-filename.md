## Scenario
The repo has `.github/ISSUE_TEMPLATE/issue.md` (filename does not contain "bug"). Its frontmatter `labels` field contains `["bug"]`.

## Expected Behavior
The skill matches the template based on the `labels` frontmatter field, not the filename. It uses the template sections.

## Pass Criteria
- [ ] Did NOT skip the template because its filename lacks "bug"
- [ ] Detected "bug" in the frontmatter `labels` field
- [ ] Used the template sections to structure the interview
