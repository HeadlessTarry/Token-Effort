## Scenario
.github/dependabot.yml already exists. User invokes `/repo-setup` and reaches Phase 2. User says "yes" when asked about overwriting.

## Expected Behavior
Phase 2 detects existing dependabot.yml, warns, asks "`.github/dependabot.yml` already exists. Overwrite? [yes/no]", receives "yes", and delegates to /configuring-dependabot.

## Pass Criteria
- [ ] Detected existing .github/dependabot.yml
- [ ] Warned that dependabot.yml already exists
- [ ] Asked for overwrite confirmation
- [ ] Invoked /configuring-dependabot via the Skill tool after "yes"
- [ ] Completion summary notes "Dependabot: configured"
