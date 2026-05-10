## Scenario

The user invokes `/move-issue-status 42 "Planning"`. Issue #42 appears on two different GitHub project boards owned by the same owner.

## Expected Behavior

The skill detects that the issue appears on multiple project boards and stops with an error message indicating the ambiguity.

## Pass Criteria

- [ ] Called `gh project list` to enumerate project boards
- [ ] Called `gh project item-list` for each project
- [ ] Used `jq` to find issue #42 on multiple boards
- [ ] Printed an error message referencing issue #42 and stating it appears on multiple project boards
- [ ] Did NOT call `gh project field-list` or `gh project item-edit`
