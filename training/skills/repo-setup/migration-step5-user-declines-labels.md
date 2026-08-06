## Scenario
User is running the migration flow and reaches Step 5. User responds "no" to "Would you like me to update the labels now?"

## Expected Behavior
The skill notes "Labels: skipped (user declined)" and continues to Step 6.

## Pass Criteria
- [ ] Skill notes "Labels: skipped (user declined)" in the summary
- [ ] Skill continues to Step 6 without blocking
- [ ] Skill does not modify any labels
