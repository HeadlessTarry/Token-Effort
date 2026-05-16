## Scenario

The user runs `/report-bug`. The interview is complete, the draft is approved, and the skill proceeds to Phase 4 to file the issue.

## Expected Behaviour

- The skill runs `gh issue create --title "<title>" --body "<body>"`.
- After the command completes, the skill reports the filed issue URL to the user.

## Pass Criteria

- [ ] `gh issue create` is called with `--title` and `--body` flags.
- [ ] The skill reports the filed issue URL to the user after `gh issue create` completes.
- [ ] The URL is the one printed by `gh issue create`.
