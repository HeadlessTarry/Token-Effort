## Scenario
A repository contains only .pre-commit-config.yaml at the root. No other ecosystem indicators
exist. No .github/dependabot.yml exists.

## Expected Behavior
The skill detects pre-commit, skips Phase 2 (no existing file), and writes
.github/dependabot.yml with a single pre-commit entry. The pre-commit entry does not include a
cooldown block because pre-commit is in the cooldown-exempt list.

## Pass Criteria
- [ ] Detected pre-commit ecosystem from .pre-commit-config.yaml
- [ ] Wrote .github/dependabot.yml
- [ ] Written file contains exactly one entry with package-ecosystem: pre-commit
- [ ] Entry includes schedule.interval: weekly
- [ ] Entry does NOT include a cooldown block
- [ ] Reported pre-commit in completion message
