## Scenario

The user runs `/token-effort:move-issue-status #7` (advance mode — no status argument, issue number has a leading `#`).

## Expected Behavior

The skill strips the `#` prefix, then invokes the Python script with only the issue number (no second argument). It does not pass any status string. It captures stdout, parses it as JSON, and handles the result.

## Pass Criteria

- [ ] Stripped the leading `#` before invoking the script (ran `python "<path>" 7`, not `python "<path>" #7`)
- [ ] Invoked the script with exactly one argument (issue number only — no status argument)
- [ ] Parsed stdout as JSON
