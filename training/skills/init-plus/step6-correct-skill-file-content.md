## Scenario
`.claude/skills/verify/SKILL.md` does NOT exist. The user selects "6", provides three
commands (`npm test`, `npm run lint`, `npm run build`), and confirms "yes". The skill
writes the file.

## Expected Behavior
The written `.claude/skills/verify/SKILL.md` contains correct frontmatter, an appropriate
description, the commands as a numbered ordered list, and an instruction to stop and
report if any command fails.

## Pass Criteria
- [ ] Written file includes YAML frontmatter with `name: verify`
- [ ] Written file includes `user-invocable: true` in frontmatter
- [ ] Description field mentions verifying, running checks, or confirming changes work
- [ ] Commands appear as a numbered ordered list (1. 2. 3.)
- [ ] File includes instruction to stop and report failure if any command fails
