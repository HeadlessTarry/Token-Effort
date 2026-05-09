## Scenario
A repository contains pyproject.toml and .github/workflows/test.yml. No .github/dependabot.yml
exists. pip supports cooldown; github-actions does not.

## Expected Behavior
The skill detects pip and github-actions. It writes .github/dependabot.yml with two entries:
the pip entry includes a cooldown block; the github-actions entry omits it.
This confirms the rule: cooldown is applied per-ecosystem based on support, not globally.

## Pass Criteria
- [ ] Detected pip ecosystem from pyproject.toml
- [ ] Detected github-actions ecosystem from .github/workflows/*.yml
- [ ] Wrote .github/dependabot.yml with exactly two entries
- [ ] pip entry includes full cooldown block
- [ ] github-actions entry does NOT include a cooldown block
- [ ] Both entries include schedule.interval: weekly and directory: /
- [ ] Reported pip and github-actions in completion message
