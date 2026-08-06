## Scenario
User completes the migration flow. The skill reaches the completion summary.

## Expected Behavior
The skill prints a summary covering the migration steps, with accurate outcomes. It does not make a git commit.

## Pass Criteria
- [ ] Completion summary includes: Superpowers artifacts detected, MP skills installed, Token-Effort skills installed, ADRs migration status, labels migration status, MP skills configuration status, obsolete artifacts listed
- [ ] Skill does not make a git commit after setup
