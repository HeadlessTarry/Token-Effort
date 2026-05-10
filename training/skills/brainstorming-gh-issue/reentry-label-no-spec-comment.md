## Scenario

The user runs `/brainstorming-gh-issue 7`. Issue #7 has the `pending-review` label, but none of its comments contain the marker `<!-- brainstorming-gh-issue:spec -->`. The label was added manually by a team member.

## Expected Behaviour

- The skill detects `pending-review` in the labels → enters re-entry mode.
- It searches comments for the spec marker but finds none.
- It notes that no prior spec was found (the label was likely added manually).
- It proceeds as a **fresh brainstorm** for issue #7, using only the issue context.

## Pass Criteria

- [ ] The skill detects `pending-review` and searches comments for the spec marker.
- [ ] The skill notes that no prior spec comment was found.
- [ ] Brainstorming is initiated as a fresh session using the issue context.
- [ ] The skill does NOT error out or stop because the spec comment is missing.
