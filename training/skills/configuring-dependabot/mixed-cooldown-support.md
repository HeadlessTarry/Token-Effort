## Scenario
A repository contains go.mod and .github/workflows/release.yml. No .github/dependabot.yml
exists. gomod supports cooldown; github-actions does not.

## Expected Behavior
The skill detects gomod and github-actions, writes .github/dependabot.yml with two entries.
The gomod entry includes a cooldown block; the github-actions entry does not.

## Pass Criteria
- [ ] Detected both gomod and github-actions ecosystems
- [ ] Wrote .github/dependabot.yml with exactly two entries
- [ ] gomod entry includes full cooldown block
- [ ] github-actions entry does NOT include a cooldown block
- [ ] Both entries include schedule.interval: weekly and directory: /
- [ ] Reported both ecosystems in completion message
