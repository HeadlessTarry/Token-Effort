## Scenario
User is running the migration flow and reaches Step 4. The repository contains docs/decisions/ with 3 ADR markdown files. docs/adr/ does not exist.

## Expected Behavior
The skill creates docs/adr/, moves all .md files from docs/decisions/ to docs/adr/, and removes the empty docs/decisions/ directory.

## Pass Criteria
- [ ] Skill creates docs/adr/ directory if it does not exist
- [ ] Skill moves all .md files from docs/decisions/ to docs/adr/
- [ ] Skill removes docs/decisions/ directory after migration if it is empty
- [ ] Skill notes "ADRs: migrated from docs/decisions/ to docs/adr/" in the summary
