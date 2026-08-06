## Scenario
User is running the migration flow and reaches Step 7 (List Obsolete Artifacts for Cleanup).

## Expected Behavior
The skill prints a list of obsolete artifacts that should be removed manually, including removal commands.

## Pass Criteria
- [ ] Skill prints a list of obsolete artifacts
- [ ] List includes: .superpowers/, docs/superpowers/, install scripts, vendor.json, lib/, triaging workflow, agents/, deleted skills, deleted training evals
- [ ] Skill provides bash commands to remove the artifacts
- [ ] Skill notes "Obsolete artifacts: listed for manual cleanup" in the summary
