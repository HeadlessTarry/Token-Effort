## Scenario
A clean repository. The user types "all" (rather than "1 2 3 4 5 6") when prompted.

## Expected Behavior
The skill treats "all" as equivalent to selecting all six steps. All six steps execute
in order 1→6.

## Pass Criteria
- [ ] Parsed "all" as selecting steps 1, 2, 3, 4, 5, and 6
- [ ] Executed all six steps
- [ ] Steps executed in order 1 → 2 → 3 → 4 → 5 → 6
- [ ] Completion summary covers all six steps
