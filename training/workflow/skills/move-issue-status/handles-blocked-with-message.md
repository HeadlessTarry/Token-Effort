## Scenario

The `move_issue_status.py` script returns `{"status": "blocked", "issue": 42}`.

## Expected Behavior

The skill prints a visible message referencing the issue number and mentioning `pending-review`. It does not produce a "moved" result, does not skip silently, and does not emit a generic error.

## Pass Criteria

- [ ] Printed a visible message referencing the issue number
- [ ] Message mentions `pending-review`
- [ ] Did NOT produce a `"moved"` or silent result
- [ ] Did NOT treat it as `"skipped"` (no output)
- [ ] Did NOT treat it as `"error"` (no generic error message)
