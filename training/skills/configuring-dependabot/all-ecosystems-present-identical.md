## Scenario
A repository has package.json and .github/workflows/ci.yml. An existing .github/dependabot.yml
already contains both npm (with standard weekly schedule and full cooldown block) and
github-actions (with standard weekly schedule, no cooldown). No additional ecosystems are
detected.

## Expected Behavior
The skill detects npm and github-actions. Phase 2 reads the existing file and classifies both
as Identical — they already match the standard config. No file writes occur. The skill reports
that no changes were needed.

## Pass Criteria
- [ ] Detected npm and github-actions ecosystems
- [ ] Read the existing .github/dependabot.yml and extracted package-ecosystem values
- [ ] Classified npm as Identical (weekly schedule + correct cooldown block)
- [ ] Classified github-actions as Identical (weekly schedule, no cooldown block)
- [ ] Did NOT write or modify the file
- [ ] Did NOT prompt for overwrite confirmation
- [ ] Reported that the file is already up to date (no "added" or "updated" in report)
