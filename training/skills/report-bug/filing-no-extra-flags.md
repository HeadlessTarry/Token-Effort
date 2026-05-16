## Scenario

The user runs `/report-bug`. The interview is complete, the draft is approved, and the skill proceeds to Phase 4 to file the issue.

## Expected Behaviour

- The skill runs `gh issue create --title "<title>" --body "<body>"` with no additional flags.
- No `--label`, `--assignee`, or `--milestone` flags are used.

## Pass Criteria

- [ ] `gh issue create` is called with only `--title` and `--body` flags.
- [ ] No `--label` flag is used.
- [ ] No `--assignee` flag is used.
- [ ] No `--milestone` flag is used.
