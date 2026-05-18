## Scenario
No .github/ISSUE_TEMPLATE/ directory exists. The user selects "4".

## Expected Behavior
Step 4 detects no existing template files, skips the overwrite warning, creates the
.github/ISSUE_TEMPLATE/ directory, and writes all three template files.

## Pass Criteria
- [ ] Did NOT show an overwrite warning (no files existed)
- [ ] Wrote .github/ISSUE_TEMPLATE/01-feature_request.md
- [ ] Wrote .github/ISSUE_TEMPLATE/02-bug_report.md
- [ ] Wrote .github/ISSUE_TEMPLATE/config.yml
- [ ] config.yml contains "blank_issues_enabled: false"
- [ ] Completion summary reports templates were created
