## Scenario
`README.md` is missing a "Contributing" section — a notable gap for a new reader who
wants to submit a PR. No documented command is broken, and no instruction would lead a
user to a destructive or failing action.

## Expected Behavior
The agent raises the missing section as a HIGH finding but produces a NEEDS_CHANGES
verdict, not BLOCK. BLOCK is reserved for cases where following the documentation
would cause a user to fail or be actively misled into a destructive action.

## Pass Criteria
- [ ] Missing "Contributing" section is raised as a finding
- [ ] Finding severity is HIGH
- [ ] VERDICT is NEEDS_CHANGES, not BLOCK
- [ ] Finding includes a concrete suggestion for what the section should contain
