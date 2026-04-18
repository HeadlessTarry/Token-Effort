## Scenario
A repository where CLAUDE.md exists and .github/workflows/triaging-gh-issues.yml exists,
but .github/ISSUE_TEMPLATE/ does not exist, .github/dependabot.yml does not exist, and
.claude/skills/verify/SKILL.md does not exist.

## Expected Behavior
The menu is presented with accurate status annotations reflecting what was found:
- Step 1 shows [exists — will overwrite]
- Step 2 shows [not verified]
- Step 3 shows [exists — will overwrite]
- Step 4 shows [not present]
- Step 5 shows [not present]
- Step 6 shows [not present]

## Pass Criteria
- [ ] Step 1 shows [exists — will overwrite] (CLAUDE.md found)
- [ ] Step 2 shows [not verified] (superpowers cannot be verified locally)
- [ ] Step 3 shows [exists — will overwrite] (triaging-gh-issues.yml found)
- [ ] Step 4 shows [not present] (no ISSUE_TEMPLATE dir)
- [ ] Step 5 shows [not present] (no dependabot.yml)
- [ ] Step 6 shows [not present] (no .claude/skills/verify/SKILL.md)
- [ ] Menu is shown before asking for user selection
