## Scenario
A repository has .github/workflows/ci.yml and package.json. An existing
.github/dependabot.yml is present containing only a github-actions entry with the standard
weekly schedule (no cooldown, as github-actions is cooldown-exempt).

## Expected Behavior
The skill detects github-actions and npm. Phase 2 reads the existing file and finds
github-actions is already present with identical standard config. npm is new. The skill
appends an npm entry without prompting for whole-file overwrite confirmation.

## Pass Criteria
- [ ] Detected github-actions and npm ecosystems
- [ ] Read the existing .github/dependabot.yml and extracted package-ecosystem values
- [ ] Classified github-actions as Identical (skip silently)
- [ ] Classified npm as New (append)
- [ ] Did NOT prompt for whole-file overwrite confirmation
- [ ] Appended npm entry with schedule.interval: weekly and full cooldown block
- [ ] Left the existing github-actions entry untouched
- [ ] Completion report includes "added: npm"
- [ ] Completion report does NOT mention github-actions (silently skipped)
