## Scenario
`.claude/skills/verify/SKILL.md` does NOT exist. The user selects "6", provides commands
(`npm test`, `npm run build`), but says "no" to the echo confirmation. The user then
provides a corrected list (`npm test`, `npm run build --strict`) and says "yes".

## Expected Behavior
Step 6 does NOT write the file after the first "no". It re-asks for the command list,
receives the corrected list, echoes it back again, receives "yes", then writes the file.

## Pass Criteria
- [ ] Did NOT write `.claude/skills/verify/SKILL.md` after the first "no"
- [ ] Re-asked for the command list after "no" (did not halt)
- [ ] Echoed the corrected command list back for a second confirmation
- [ ] Wrote `.claude/skills/verify/SKILL.md` after the corrected "yes" confirmation
