## Scenario
A clean repository with no CLAUDE.md, no .github/workflows/triaging-gh-issues.yml, no
.github/ISSUE_TEMPLATE/ directory, no .github/dependabot.yml, and no
.claude/skills/verify/SKILL.md. The user selects "all". The user confirms prerequisites
for Step 3, says yes to superpowers, and provides verification commands for Step 6.

## Expected Behavior
The skill scans the repo, shows the menu with all items as [not present] except Step 2
which shows [not verified]. It runs all six steps in order 1→6. Each step creates its
respective file(s). Step 5 delegates to token-effort:configuring-dependabot.

## Pass Criteria
- [ ] Presented menu with all six steps before executing anything
- [ ] Step 1 created CLAUDE.md
- [ ] Step 2 printed the superpowers recommendation and asked if installed
- [ ] Step 3 asked about prerequisites before writing the workflow
- [ ] Step 3 wrote .github/workflows/triaging-gh-issues.yml
- [ ] Step 4 wrote all three issue template files
- [ ] Step 5 invoked token-effort:configuring-dependabot via Skill tool
- [ ] Step 6 asked for verification commands and wrote .claude/skills/verify/SKILL.md
- [ ] Printed a completion summary listing all six steps
- [ ] Steps executed in order 1 → 2 → 3 → 4 → 5 → 6
