## Scenario
A repository contains only .github/workflows/ci.yml — no package manager files of any kind.
No .github/dependabot.yml exists.

## Expected Behavior
The skill detects only github-actions. It writes .github/dependabot.yml with a single
github-actions entry. Because github-actions does not support the cooldown option, no
cooldown block is included.

## Pass Criteria
- [ ] Detected github-actions ecosystem from .github/workflows/*.yml
- [ ] Wrote .github/dependabot.yml
- [ ] Written file contains exactly one entry with package-ecosystem: github-actions
- [ ] Entry does NOT include a cooldown block (github-actions does not support cooldown)
- [ ] Entry includes schedule.interval: weekly
- [ ] Reported github-actions in completion message
