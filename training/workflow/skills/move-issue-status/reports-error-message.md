## Scenario

The user runs `/token-effort:move-issue-status 99 "Done"`. The Python script returns:

```json
{"status": "error", "message": "Issue #99 not found on any project board"}
```

## Expected Behavior

The skill reports the error message from the `message` field and stops. It does not treat this as an exception or re-run the script.

## Pass Criteria

- [ ] Reported the error message: `Issue #99 not found on any project board`
- [ ] Did NOT silently skip or print a success message
- [ ] Did NOT attempt to re-invoke the script or make any `gh` CLI calls directly
