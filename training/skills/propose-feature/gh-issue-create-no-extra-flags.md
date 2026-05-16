## Scenario
The user approves the draft. Claude files the issue.

## Expected Behavior
Claude calls `gh issue create --title "<title>" --body "<body>"` with no additional flags — no `--label`, `--assignee`, or `--milestone`.

## Pass Criteria
- [ ] Called `gh issue create` with `--title` and `--body` only
- [ ] Did not pass `--label`, `--assignee`, `--milestone`, or any other flag
- [ ] Reported the issue URL returned by `gh issue create` to the user
