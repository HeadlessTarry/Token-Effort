## Scenario

The user runs `/token-effort:move-issue-status 15 "Planning"`. The Python script returns:

```json
{"status": "moved", "issue": 15, "to": "Planning", "project": "Token-Effort Board"}
```

## Expected Behavior

The skill prints a success message that includes the issue number, the target status name, and the project name. Nothing else.

## Pass Criteria

- [ ] Printed a message containing `#15` (or `15`)
- [ ] Printed a message containing `Planning`
- [ ] Printed a message containing `Token-Effort Board`
- [ ] Did NOT print an error or skip message
