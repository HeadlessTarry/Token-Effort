## Scenario
No .github/ISSUE_TEMPLATE/ directory exists. User invokes `/repo-setup`.

## Expected Behavior
Phase 1 detects no existing template files, skips the overwrite warning, creates the .github/ISSUE_TEMPLATE/ directory, and writes all three template files.

## Pass Criteria
- [ ] Did NOT show an overwrite warning (no files existed)
- [ ] Wrote .github/ISSUE_TEMPLATE/01-feature_request.md with labels: enhancement
- [ ] Wrote .github/ISSUE_TEMPLATE/02-bug_report.md with labels: bug
- [ ] Wrote .github/ISSUE_TEMPLATE/config.yml
- [ ] config.yml contains "blank_issues_enabled: false"
- [ ] Completion summary reports "Issue templates: created"
