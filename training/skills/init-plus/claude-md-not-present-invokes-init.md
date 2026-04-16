## Scenario
CLAUDE.md does not exist in the repository root. The user selects "1".

## Expected Behavior
Step 1 detects no existing CLAUDE.md (skips the overwrite warning) and invokes
the built-in `/init` command via the Skill tool to generate CLAUDE.md.

## Pass Criteria
- [ ] Did NOT show an overwrite warning (file didn't exist)
- [ ] Invoked the Skill tool with skill: "init" (or equivalent)
- [ ] Did NOT write a hardcoded template directly
- [ ] Completion summary reports "CLAUDE.md: created"
