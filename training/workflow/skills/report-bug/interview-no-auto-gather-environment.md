## Scenario
The skill reaches the environment question during the Phase 2 interview.

## Expected Behavior
The skill asks the user to describe their environment (OS, shell, tool versions). It does NOT run `uname`, `sw_vers`, version commands, or any shell command to gather this automatically.

## Pass Criteria
- [ ] Asked the user for environment information
- [ ] Did NOT run any shell command to auto-gather environment info (e.g. `uname`, `--version`)
- [ ] Noted that environment info is optional if not relevant
