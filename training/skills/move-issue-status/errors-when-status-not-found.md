## Scenario

The user invokes `/move-issue-status 42 "Review"`. Issue #42 is on a project board, but the Status field options are: "New", "Brainstorming", "Building", "Done". No option contains "Review".

## Expected Behavior

The skill finds the issue on the board, retrieves the Status field options, fails to match "Review" against any option (case-insensitive substring), and stops with an error listing the available options.

## Pass Criteria

- [ ] Called `gh issue view 42 --json labels` (no pending-review)
- [ ] Found issue #42 on a project board
- [ ] Called `gh project field-list` to get Status field options
- [ ] Used case-insensitive substring matching and found no match for "Review"
- [ ] Printed an error message containing "Review" and listing available options: "New", "Brainstorming", "Building", "Done"
- [ ] Did NOT call `gh project item-edit`
