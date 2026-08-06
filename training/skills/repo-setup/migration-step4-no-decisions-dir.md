## Scenario
User is running the migration flow and reaches Step 4. The repository does not contain docs/decisions/.

## Expected Behavior
The skill notes that no migration is needed and continues to Step 5.

## Pass Criteria
- [ ] Skill checks if docs/decisions/ exists
- [ ] Skill notes "ADRs: no migration needed (docs/decisions/ not found)" in the summary
- [ ] Skill continues to Step 5 without blocking
