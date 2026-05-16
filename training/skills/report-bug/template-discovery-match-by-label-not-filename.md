## Scenario

The repo contains `.github/ISSUE_TEMPLATE/bug-report.md` with frontmatter `labels: ["bug", "triage"]` and `.github/ISSUE_TEMPLATE/feature-request.md` with frontmatter `labels: ["enhancement"]`. The skill runs Phase 1 template discovery.

## Expected Behaviour

- The skill matches the bug template by reading the `labels` frontmatter field, not by filename.
- The feature request template is not selected as a bug template.

## Pass Criteria

- [ ] The skill reads template content and checks the `labels` frontmatter field for "bug" or "defect".
- [ ] `bug-report.md` is selected because its `labels` field contains "bug".
- [ ] `feature-request.md` is not selected as a bug template.
- [ ] The match is based on frontmatter `labels`, not on the filename containing "bug".
