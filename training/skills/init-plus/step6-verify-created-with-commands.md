## Scenario
`.claude/skills/verify/SKILL.md` does NOT exist. The user selects "6", provides two
commands (`npm test` and `npm run lint`), and says "yes" when the skill echoes the list
back for confirmation.

## Expected Behavior
Step 6 asks for commands, echoes them back, receives confirmation, writes the skill file,
and notes the outcome in the summary.

## Pass Criteria
- [ ] Asked the user for verification commands
- [ ] Echoed the command list back to the user for confirmation before writing
- [ ] Wrote `.claude/skills/verify/SKILL.md` after the user confirmed
- [ ] Noted "`/verify`: created" (or equivalent) in the completion summary
