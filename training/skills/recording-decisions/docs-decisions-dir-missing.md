## Scenario
The skill is invoked in a repo where `docs/decisions/` does not exist at all.

## Expected Behavior
The skill creates the directory before writing the ADR file. The commit succeeds.

## Pass Criteria
- [ ] `docs/decisions/` directory is created (skill does not error on missing directory)
- [ ] ADR file is written to the newly created directory
- [ ] No error or warning about missing directory is shown to the user
- [ ] Commit includes the new ADR file
