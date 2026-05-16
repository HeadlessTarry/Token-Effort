## Scenario

The user runs `/report-bug`. During the Phase 2 interview, the skill reaches the environment question. The user's system is Linux with bash available.

## Expected Behaviour

- The skill asks the user to describe their environment (OS, shell, tool versions, etc.).
- The skill does NOT run commands like `uname`, `node --version`, `gh --version`, or any other command to auto-gather environment information.
- The skill notes that environment info is optional if not relevant to this bug.

## Pass Criteria

- [ ] The skill asks the user to describe their environment rather than running system commands.
- [ ] No `uname`, `cat /etc/os-release`, `node --version`, `python --version`, or similar auto-gather commands are executed.
- [ ] The skill mentions that environment info is optional if not relevant.
