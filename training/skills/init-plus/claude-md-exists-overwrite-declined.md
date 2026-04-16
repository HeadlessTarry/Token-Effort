## Scenario
CLAUDE.md already exists in the repository root with custom content. The user
selects "1" and then says "no" when asked to overwrite.

## Expected Behavior
Step 1 detects the existing file, warns the user, and asks "Overwrite? [yes/no]".
The user says no. The skill skips Step 1 without invoking /init.

## Pass Criteria
- [ ] Warned that CLAUDE.md already exists
- [ ] Asked for overwrite confirmation before proceeding
- [ ] Did NOT invoke /init (Skill tool not called for "init")
- [ ] Did NOT write CLAUDE.md (original content preserved)
- [ ] Noted "skipped (overwrite declined)" or equivalent in the completion summary
- [ ] Did NOT halt the skill entirely after the decline
