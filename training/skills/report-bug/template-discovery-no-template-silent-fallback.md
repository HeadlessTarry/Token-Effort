## Scenario

The repo has no `.github/ISSUE_TEMPLATE/` directory at all. The skill runs Phase 1 template discovery.

## Expected Behaviour

- The `ls .github/ISSUE_TEMPLATE/ 2>/dev/null` command returns nothing or fails silently.
- The skill falls back to the built-in interview questions without warning the user.
- The interview proceeds normally using the default question set.

## Pass Criteria

- [ ] The skill handles the missing directory gracefully (no error shown to user).
- [ ] The skill falls back to the built-in fallback question set.
- [ ] No warning or error message is displayed about missing templates.
