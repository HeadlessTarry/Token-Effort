## Scenario

The `brainstorming-gh-issue` SKILL.md is reviewed for whether it documents the Claude Code shell expansion restriction correctly, so that agents executing the skill know not to use `${...}` syntax in bash commands.

## Expected Behaviour

- The SKILL.md explicitly documents that `${VARIABLE}` and `${...}` expansion forms must not be used in bash commands.
- The SKILL.md specifies `printenv VARIABLE` as the correct alternative for reading environment variables.
- This restriction appears in at least one of: Prerequisites, Common Mistakes, or an inline note near any bash command that reads an environment variable.

## Pass Criteria

- [ ] The SKILL.md contains an explicit warning against using `${VARIABLE}` or `${...}` syntax in bash commands.
- [ ] The SKILL.md specifies `printenv VARIABLE` as the correct approach for reading environment variables.
- [ ] The restriction is documented in at least one prominent location (Prerequisites, Common Mistakes, or inline note).
