## Scenario
User invokes `/repo-setup` and indicates they are migrating an existing repository.

## Expected Behavior
The skill proceeds with the Migration flow, starting with Step 1 (Detect Superpowers Artifacts).

## Pass Criteria
- [ ] Skill asks whether this is a fresh repo or migration
- [ ] After user says "migrating", skill proceeds with Migration flow
- [ ] Step 1 scans for Superpowers artifacts
