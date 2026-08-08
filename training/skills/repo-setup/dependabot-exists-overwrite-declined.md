## Scenario
.github/dependabot.yml already exists. User invokes `/repo-setup` and reaches Phase 2. User says "no" when asked about overwriting.

## Expected Behavior
Phase 2 detects existing dependabot.yml, warns, asks for confirmation, receives "no", and skips Dependabot configuration. The skill completes with a summary.

## Pass Criteria
- [ ] Detected existing .github/dependabot.yml
- [ ] Warned that dependabot.yml already exists
- [ ] Asked for overwrite confirmation
- [ ] Did NOT invoke /configuring-dependabot after "no"
- [ ] Noted "Dependabot: skipped (overwrite declined)" in the completion summary
