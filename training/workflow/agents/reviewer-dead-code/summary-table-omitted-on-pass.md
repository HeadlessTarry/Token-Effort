## Scenario
The agent reviews a branch diff and finds no dead code in any of the changed files.
The verdict is PASS.

## Expected Behavior
The agent outputs VERDICT: PASS, a Positive Elements section, and nothing else.
The Summary Table section is completely omitted — not included as an empty table.

## Pass Criteria
- [ ] VERDICT is PASS
- [ ] No Summary Table section appears in the output
- [ ] A Positive Elements section is present
- [ ] No Dead Code Findings section appears (or it is empty and clearly marked as such)
