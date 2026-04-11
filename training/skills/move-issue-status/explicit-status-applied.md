## Scenario

The user runs `/token-effort:move-issue-status 42 "Building"`. Issue #42 is on exactly one project board. Its current Status column is "Triaged" (index 1). The "Building" option exists in the project's Status field.

## Expected Behaviour

- The skill retrieves the list of projects and finds exactly one project containing issue #42.
- It fetches the project's field list and locates the Status field with all available options.
- It matches "Building" case-insensitively against the available options.
- It calls `gh project item-edit` with the correct item ID, field ID, and "Building" option ID.
- It does not check or care that the current column is not index 0 — explicit mode always applies the named status.
- A success message is shown including the issue number, the status name applied, and the project name.

## Pass Criteria

- [ ] `gh project list` is called to enumerate projects.
- [ ] `gh project item-list` is called to find issue #42 in the project.
- [ ] `gh project field-list` is called to retrieve Status field options.
- [ ] "Building" is matched case-insensitively against the available status options.
- [ ] `gh project item-edit` is called with the correct option ID for "Building".
- [ ] The success message includes the issue number (42), the status name ("Building"), and the project name.
- [ ] The current column position ("Triaged", index 1) did NOT prevent the update.
