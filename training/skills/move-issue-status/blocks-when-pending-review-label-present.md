## Scenario

The user invokes the `move-issue-status` skill for issue #42. The `gh issue view 42 --json labels` command returns labels including `pending-review`.

## Expected Behavior

The skill detects the `pending-review` label using `jq` and stops immediately. It does not run any `gh project` commands. It reports a visible message referencing the issue number and mentioning `pending-review`.

## Pass Criteria

- [ ] Called `gh issue view 42 --json labels`
- [ ] Used `jq` to check for `pending-review` in the labels array
- [ ] Printed a visible message referencing issue #42 and mentioning `pending-review`
- [ ] Did NOT call `gh project list`, `gh project item-list`, `gh project field-list`, or `gh project item-edit`
