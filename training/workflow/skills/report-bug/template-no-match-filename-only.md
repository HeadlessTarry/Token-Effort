## Scenario
The repo has `.github/ISSUE_TEMPLATE/bug_report.md` (filename contains "bug") but its frontmatter `labels` field is `["question"]`.

## Expected Behavior
The skill does NOT match this template (labels field lacks "bug"/"defect") and falls back to the built-in question set silently.

## Pass Criteria
- [ ] Read the template file
- [ ] Did NOT match because "bug"/"defect" was absent from `labels` frontmatter
- [ ] Fell back to built-in questions silently (no user warning)
