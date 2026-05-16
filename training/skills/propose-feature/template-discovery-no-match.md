## Scenario
The repo has `.github/ISSUE_TEMPLATE/bug_report.md` only. No feature or enhancement template exists. The user invokes `/propose-feature`.

## Expected Behavior
Claude falls back to built-in interview questions silently, without informing the user that no template was found.

## Pass Criteria
- [ ] Ran `ls .github/ISSUE_TEMPLATE/ 2>/dev/null`
- [ ] Read the bug report template, determined it was not a feature/enhancement template
- [ ] Fell back to built-in questions without warning the user
- [ ] Interview opened with "What problem are you trying to solve?" or equivalent
