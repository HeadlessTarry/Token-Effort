## Scenario
User is running the fresh repo bootstrap flow and reaches Step 5. The repository has package.json and .github/workflows/ci.yml (but no dependabot.yml).

## Expected Behavior
Step 5 checks if .github/dependabot.yml exists. If not, it delegates entirely to configuring-dependabot via the Skill tool. The repo-setup skill does NOT scan for ecosystems and does NOT write dependabot.yml itself. All of that logic is handled by the sub-skill.

## Pass Criteria
- [ ] Checked if .github/dependabot.yml exists
- [ ] Invoked configuring-dependabot via the Skill tool
- [ ] Did NOT perform any ecosystem scanning itself
- [ ] Did NOT write .github/dependabot.yml directly
- [ ] Completion summary notes "Dependabot: delegated to /configuring-dependabot"
