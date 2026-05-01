## Scenario
The `SKILL_DIR` (`$HOME/.claude/skills/computing-branch-diff`) does not exist —
the Token-Effort install script has not been run.

## Expected Behavior
The skill detects the missing directory, reports the error:
"ERROR: skill scripts not found at $SKILL_DIR. Run the Token-Effort install script first."
and exits without running any diff logic.

## Pass Criteria
- [ ] Missing SKILL_DIR is detected before attempting to run the script
- [ ] No diff, file list, or commit output is produced
