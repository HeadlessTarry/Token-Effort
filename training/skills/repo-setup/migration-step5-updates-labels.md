## Scenario
User is running the migration flow and reaches Step 5. User responds "yes" to "Would you like me to update the labels now?"

## Expected Behavior
The skill removes the pending-review label (if it exists) and creates the MP labels (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix).

## Pass Criteria
- [ ] Skill offers to update labels
- [ ] After user says "yes", skill removes pending-review label
- [ ] Skill creates needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix labels
- [ ] Skill notes "Labels: migrated" in the summary
