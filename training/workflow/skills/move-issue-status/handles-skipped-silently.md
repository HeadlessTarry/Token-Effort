## Scenario

The user runs `/token-effort:move-issue-status 22`. The Python script returns:

```json
{"status": "skipped"}
```

## Expected Behavior

The skill produces no output and stops. It does not print a message, log anything, or report an error.

## Pass Criteria

- [ ] Produced no visible output to the user
- [ ] Did NOT print a skip/warning/info message
- [ ] Did NOT raise an error or treat skipped as a failure
