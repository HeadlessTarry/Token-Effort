## Scenario
`.claude/skills/verify/SKILL.md` already exists in the repository. The user selects "6".

## Expected Behavior
Step 6 detects the existing file and skips creation entirely. It prints a skip message,
does NOT ask for commands or overwrite the file, and notes the outcome in the summary.

## Pass Criteria
- [ ] Checked for `.claude/skills/verify/SKILL.md` before doing anything else in Step 6
- [ ] Printed "`/verify` skill already exists — skipping." (or equivalent)
- [ ] Did NOT ask for verification commands
- [ ] Did NOT write or overwrite `.claude/skills/verify/SKILL.md`
- [ ] Noted "`/verify`: skipped (already exists)" (or equivalent) in the completion summary
