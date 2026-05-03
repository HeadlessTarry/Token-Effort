## Scenario

`gh issue view --json labels` returns labels including `pending-review` for the given issue.

## Expected Behavior

The script returns `{"status": "blocked", "issue": N, "reason": "pending-review"}` without calling any project board commands.

## Pass Criteria

- [ ] Called `gh issue view --json labels` for the issue
- [ ] Detected `pending-review` in the labels array
- [ ] Returned `{"status": "blocked", "issue": <N>, "reason": "pending-review"}` with exit code 0
- [ ] Did NOT call `gh project item-list`, `gh project field-list`, or `gh project item-edit`
- [ ] Exit code is 0
