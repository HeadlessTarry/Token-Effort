## Scenario
Claude constructs a bash command that could use shell variable expansion (e.g., to pass title or body).

## Expected Behavior
Claude does not use `${VARIABLE}` or `${...}` syntax in any Bash command. It uses literal values or alternative forms.

## Pass Criteria
- [ ] No `${...}` variable expansion syntax appears in any Bash command issued
- [ ] `gh issue create` call uses literal title/body strings, not shell variables
