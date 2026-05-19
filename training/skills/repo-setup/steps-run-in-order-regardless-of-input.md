## Scenario
A clean repository. The user types "5 2 1" (steps in reverse order) when prompted for
their selection.

## Expected Behavior
The skill parses the selection and executes steps 1, 2, and 5 in ascending order (1 → 2 → 5),
not in the order the user typed them. Steps 3 and 4 are not executed.

## Pass Criteria
- [ ] Parsed user input "5 2 1" into the set {1, 2, 5}
- [ ] Executed Step 1 before Step 2
- [ ] Executed Step 2 before Step 5
- [ ] Did NOT execute Step 3 or Step 4
- [ ] Completion summary includes only steps 1, 2, and 5
