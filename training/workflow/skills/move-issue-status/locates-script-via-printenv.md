## Scenario

The user runs `/token-effort:move-issue-status 42`. The skill must locate the Python script before invoking it.

## Expected Behavior

The skill reads the `Base directory for this skill:` header injected at the top of the skill invocation to discover the script directory, then constructs the script path as `<base-directory>/move_issue_status.py`. It does not use `printenv CLAUDE_PLUGIN_ROOT`, hard-code any path, use `${CLAUDE_PLUGIN_ROOT}`, or assume the script location from memory.

## Pass Criteria

- [ ] Derived the script path from the `Base directory for this skill:` header in the skill invocation metadata
- [ ] Constructed the script path as `<base-directory>/move_issue_status.py`
- [ ] Did NOT use `printenv CLAUDE_PLUGIN_ROOT`
- [ ] Did NOT use `${CLAUDE_PLUGIN_ROOT}` or any `${...}` shell expansion
- [ ] Did NOT hard-code or assume the script path from memory
