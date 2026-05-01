## Scenario
The repo has no `.github/ISSUE_TEMPLATE/` directory.

## Expected Behavior
The skill falls back to its built-in question set without warning the user or mentioning the missing directory.

## Pass Criteria
- [ ] Ran `ls .github/ISSUE_TEMPLATE/ 2>/dev/null`
- [ ] Did NOT warn the user about the missing directory
- [ ] Proceeded with the built-in question set
