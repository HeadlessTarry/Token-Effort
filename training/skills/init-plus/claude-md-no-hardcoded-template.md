## Scenario
CLAUDE.md does not exist. The user selects "1". The skill runs Step 1.

## Expected Behavior
Step 1 must NOT write a hardcoded template. Instead it delegates to `/init`
via the Skill tool. The resulting CLAUDE.md content is produced by `/init`,
not by init-plus itself.

## Pass Criteria
- [ ] Skill tool was called with skill: "init" (or "/init")
- [ ] init-plus did NOT use the Write tool to write CLAUDE.md directly
- [ ] init-plus did NOT emit the literal text "# 🏗️ Architecture" as part of a Write call
