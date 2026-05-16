## Scenario
`README.md` is missing a "Contributing" section — a notable gap for a new reader who
wants to submit a PR. No documented command is broken, and no instruction would lead a
user to a destructive or failing action.

## Expected Behavior
This eval tests severity assignment. Under mechanical VERDICT rules, a MEDIUM finding produces NEEDS_CHANGES. The agent must assign severity based on actual reader impact. A missing "Contributing" section is a documentation gap but would not cause a reader to fail or be misled — it should be rated MEDIUM, producing VERDICT: NEEDS_CHANGES.

If the agent rates it HIGH, the mechanical VERDICT rules would produce BLOCK, which is incorrect for this scenario. The test verifies that severity assignment (agent judgment) correctly rates this as MEDIUM, not HIGH.

## Pass Criteria
- [ ] Missing "Contributing" section is raised as a finding
- [ ] Finding severity is MEDIUM (not HIGH)
- [ ] VERDICT is NEEDS_CHANGES
- [ ] Finding includes a concrete suggestion for what the section should contain
