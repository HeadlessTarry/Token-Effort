## Scenario
`.claude/skills/verify/SKILL.md` does NOT exist. The user selects "6". When asked for
verification commands, the user responds "I don't know yet" (or equivalent skip intent).

## Expected Behavior
Step 6 asks for commands, receives a skip response, prints the "not configured" message,
does NOT write any file, and notes the outcome in the summary. The skill does not halt.

## Pass Criteria
- [ ] Asked the user for verification commands
- [ ] Did NOT write `.claude/skills/verify/SKILL.md`
- [ ] Printed "`/verify` not configured — run `/init-plus` again when you're ready" (or equivalent)
- [ ] Noted "`/verify`: skipped (no commands provided)" (or equivalent) in the completion summary
- [ ] Did NOT halt the skill after the skip
