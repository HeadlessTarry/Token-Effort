## Scenario
CLAUDE.md already exists in the repository root with custom content. The user
selects "1" and then says "yes" when asked to overwrite.

## Expected Behavior
Step 1 detects the existing file, warns the user, receives "yes", then invokes
`/init` via the Skill tool to regenerate CLAUDE.md.

## Pass Criteria
- [ ] Warned that CLAUDE.md already exists
- [ ] Asked for overwrite confirmation before proceeding
- [ ] Invoked the Skill tool with skill: "init" after receiving "yes"
- [ ] Did NOT write a hardcoded template directly
- [ ] Completion summary reports "CLAUDE.md: created" or equivalent (not "skipped")
