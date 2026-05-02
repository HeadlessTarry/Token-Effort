## Scenario
The user selects "5". The repository has package.json and .github/workflows/ci.yml
(but no dependabot.yml).

## Expected Behavior
Step 5 delegates entirely to token-effort-initialise:configuring-dependabot via the Skill tool.
The init-plus skill does NOT scan for ecosystems, does NOT check for existing dependabot
files, and does NOT write dependabot.yml itself. All of that logic is handled by the
sub-skill.

## Pass Criteria
- [ ] Invoked token-effort-initialise:configuring-dependabot via the Skill tool
- [ ] Did NOT perform any ecosystem scanning itself
- [ ] Did NOT write .github/dependabot.yml directly
- [ ] Did NOT check for existing .github/dependabot.yml or .github/dependabot.yaml itself
- [ ] Completion summary notes that Dependabot was delegated to /configuring-dependabot
