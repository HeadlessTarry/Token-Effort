## Scenario
A repository contains only a package.json at the root. No other ecosystem indicators exist.
No .github/dependabot.yml exists.

## Expected Behavior
The skill detects npm, skips Phase 2 (no existing file), and writes .github/dependabot.yml
with a single npm entry including schedule.interval: weekly and the cooldown block.

## Pass Criteria
- [ ] Detected npm ecosystem from package.json
- [ ] Wrote .github/dependabot.yml
- [ ] Written file contains exactly one entry with package-ecosystem: npm
- [ ] Entry includes schedule.interval: weekly
- [ ] Entry includes cooldown block with default-days: 20, semver-patch-days: 10, semver-minor-days: 20, semver-major-days: 30
- [ ] Reported which ecosystems were configured after writing
