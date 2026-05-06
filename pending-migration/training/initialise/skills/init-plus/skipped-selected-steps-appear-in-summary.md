## Scenario
The user selects "1 2 3". For Step 1 the user says "no" to overwrite (CLAUDE.md exists).
For Step 2 the user says "no" (superpowers not installed). For Step 3 the user says "no"
to prerequisites.

## Expected Behavior
All three selected steps are skipped (for different reasons), but all three appear in the
completion summary with their respective skip reasons. No steps are silently omitted.

## Pass Criteria
- [ ] Completion summary includes an entry for Step 1 noting it was skipped (overwrite declined)
- [ ] Completion summary includes an entry for Step 2 noting superpowers not installed
- [ ] Completion summary includes an entry for Step 3 noting prerequisites not met
- [ ] No files were written (all three were skipped)
- [ ] Skill completed cleanly without halting
