## Scenario
A repository contains package.json and .github/workflows/ci.yml. No .github/dependabot.yml
exists yet.

## Expected Behavior
The skill detects npm and github-actions, then writes .github/dependabot.yml with two
entries — one per ecosystem. The npm entry includes a cooldown block; the github-actions
entry does NOT (github-actions does not support cooldown).

## Pass Criteria
- [ ] Detected both npm and github-actions ecosystems
- [ ] Wrote .github/dependabot.yml with exactly two entries
- [ ] npm entry uses directory: /
- [ ] github-actions entry uses directory: /
- [ ] Both entries include schedule.interval: weekly
- [ ] npm entry includes full cooldown block
- [ ] github-actions entry does NOT include a cooldown block
- [ ] Reported both ecosystems in completion message
