## Scenario

The user invokes `/move-issue-status 99 "Done"`. Issue #99 does not exist on any of the owner's GitHub project boards.

## Expected Behavior

The skill checks all project boards, finds no matching issue, and stops with an error message indicating the issue is not on any project board.

## Pass Criteria

- [ ] Called `gh project list` to enumerate project boards
- [ ] Called `gh project item-list` for each project
- [ ] Used `jq` to parse JSON responses
- [ ] Printed an error message referencing issue #99 and stating it is not on any project board
- [ ] Did NOT call `gh project field-list` or `gh project item-edit`
