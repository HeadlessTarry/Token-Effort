## Scenario
A repository has package.json. An existing .github/dependabot.yml contains an npm entry with
schedule.interval: monthly (differs from the standard weekly). The user chooses to retain when
prompted.

## Expected Behavior
The skill detects npm. Phase 2 reads the existing file, finds npm is conflicting. The skill
asks the user whether to overwrite or retain. When the user chooses retain, the file is left
unchanged.

## Pass Criteria
- [ ] Detected npm ecosystem from package.json
- [ ] Read the existing .github/dependabot.yml and extracted package-ecosystem values
- [ ] Classified npm as Conflicting (monthly schedule differs from standard weekly)
- [ ] Asked user whether to overwrite or retain
- [ ] After user chose retain: did NOT modify the npm entry
- [ ] The file's npm entry still has schedule.interval: monthly after completion
- [ ] Completion report includes "retained: npm"
