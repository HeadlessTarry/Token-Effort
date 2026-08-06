## Scenario
User invokes `/repo-setup` and completes the entire fresh repo bootstrap flow.

## Expected Behavior
The skill asks whether this is a fresh repo or migration. User says "fresh". The skill proceeds through all 6 steps of the fresh flow: install MP skills, install Token-Effort, recommend /setup-matt-pocock-skills, create issue templates, configure Dependabot, and verification.

## Pass Criteria
- [ ] Skill asks whether this is a fresh repo or migration before proceeding
- [ ] After user says "fresh", skill presents Step 1 with npx skills add mattpocock/skills command
- [ ] Skill proceeds through all 6 steps in order
- [ ] Step 4 creates issue templates
- [ ] Step 5 delegates to /configuring-dependabot
- [ ] Step 6 prints verification message
