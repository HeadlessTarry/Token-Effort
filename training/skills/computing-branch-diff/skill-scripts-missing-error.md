## Scenario

The user invokes the `computing-branch-diff` skill but the `scripts/` directory does not exist (or the script files are absent).

## Expected Behaviour

The skill checks for the script directory before execution and reports a clear error message when scripts are not found.

## Pass Criteria

- [ ] Checked for the existence of the `scripts/` directory or script files
- [ ] Reported a visible error message indicating scripts are missing
- [ ] Did NOT attempt to execute a non-existent script
- [ ] Did NOT proceed with any further processing
