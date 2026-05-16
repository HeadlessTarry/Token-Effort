## Scenario
The repo has no `.github/ISSUE_TEMPLATE/` directory at all. The user invokes `/propose-feature`.

## Expected Behavior
Claude silently falls back to built-in questions. No error or warning is shown to the user.

## Pass Criteria
- [ ] Ran `ls .github/ISSUE_TEMPLATE/ 2>/dev/null` (with stderr suppressed)
- [ ] Did not warn the user that no template directory was found
- [ ] Proceeded with built-in interview questions immediately
