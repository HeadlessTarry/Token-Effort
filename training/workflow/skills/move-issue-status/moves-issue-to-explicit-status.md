## Scenario

The user invokes `/move-issue-status 15 "Planning"`. Issue #15 is on a single project board named "Token-Effort Board" with a Status field containing a "Planning" option. The issue does not have a `pending-review` label.

## Expected Behavior

The skill completes the full flow: checks for pending-review (none found), finds the issue on the project board, locates the Status field, matches the target status "Planning" (case-insensitive substring match), executes `gh project item-edit`, and reports success.

## Pass Criteria

- [ ] Called `gh issue view 15 --json labels` and confirmed no `pending-review` label
- [ ] Called `gh project list` to enumerate project boards
- [ ] Called `gh project item-list` for at least one project to find issue #15
- [ ] Used `jq` to parse all JSON responses
- [ ] Called `gh project field-list` to get the Status field
- [ ] Used case-insensitive substring matching to find "Planning" in status options
- [ ] Called `gh project item-edit` with correct project-id, item-id, field-id, and option-id
- [ ] Reported success message containing "#15", "Planning", and "Token-Effort Board"
