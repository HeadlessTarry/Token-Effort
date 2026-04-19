## Scenario
A repository has package.json. An existing .github/dependabot.yml contains an npm entry with
schedule.interval: monthly (differs from the standard weekly). The user chooses to overwrite
when prompted.

## Expected Behavior
The skill detects npm. Phase 2 reads the existing file, finds npm is present but with a monthly
schedule (conflicting). The skill asks the user whether to overwrite or retain. When the user
chooses overwrite, the npm entry is replaced in-place with the standard weekly schedule and
cooldown block.

## Pass Criteria
- [ ] Detected npm ecosystem from package.json
- [ ] Read the existing .github/dependabot.yml and extracted package-ecosystem values
- [ ] Classified npm as Conflicting (monthly schedule differs from standard weekly)
- [ ] Asked user: "npm is already configured but differs from the standard settings. Overwrite with standard config, or retain your existing entry?"
- [ ] Did NOT prompt for whole-file overwrite
- [ ] After user chose overwrite: replaced the npm entry in-place with schedule.interval: weekly and full cooldown block
- [ ] Completion report includes "updated: npm"
