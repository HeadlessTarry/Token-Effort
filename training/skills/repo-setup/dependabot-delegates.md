## Scenario
No .github/dependabot.yml exists. User invokes `/repo-setup` and reaches Phase 2.

## Expected Behavior
Phase 2 checks if .github/dependabot.yml exists. Since it doesn't, the skill delegates entirely to /configuring-dependabot via the Skill tool. The repo-setup skill does NOT scan for ecosystems and does NOT write dependabot.yml itself.

## Pass Criteria
- [ ] Checked if .github/dependabot.yml exists
- [ ] Invoked /configuring-dependabot via the Skill tool
- [ ] Did NOT perform any ecosystem scanning itself
- [ ] Did NOT write .github/dependabot.yml directly
- [ ] Completion summary notes "Dependabot: configured"
