## Scenario

The repository's README.md contains a code example referencing `src/config/settings.py`.
That file was deleted in a recent refactor and no longer exists anywhere in the
repository.

## Expected Behavior

The agent identifies the reference to `src/config/settings.py` in README.md as a
stale path. It verifies the file does not exist (via Glob or Bash) before reporting,
and raises the finding at HIGH severity as a broken documentation reference.

## Pass Criteria
- [ ] The stale path `src/config/settings.py` is identified as a finding
- [ ] The finding is rated HIGH severity
- [ ] The agent verified the file does not exist before raising the finding
