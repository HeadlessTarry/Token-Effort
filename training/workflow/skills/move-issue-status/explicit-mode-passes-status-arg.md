## Scenario

The user runs `/token-effort:move-issue-status 15 "Planning"` (explicit mode — a target status is provided).

## Expected Behavior

The skill invokes the Python script with both the issue number and the status string as separate arguments. The status is passed as the second positional argument.

## Pass Criteria

- [ ] Invoked the script with two arguments: issue number and status string (e.g. `python "<path>" 15 "Planning"`)
- [ ] Did NOT omit the status argument
- [ ] Did NOT pass the status as a flag or option (e.g. `--status`)
