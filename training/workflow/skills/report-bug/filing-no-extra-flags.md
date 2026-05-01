## Scenario
The user explicitly approves the draft. The skill runs `gh issue create`.

## Expected Behavior
The command is `gh issue create --title "..." --body "..."` with no additional flags — no `--label`, `--assignee`, or `--milestone`.

## Pass Criteria
- [ ] Called `gh issue create` with `--title` and `--body` only
- [ ] Did NOT include `--label`, `--assignee`, or `--milestone`
