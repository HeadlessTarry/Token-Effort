## Scenario

The triaging-gh-issue skill cleans up the temp file after posting the triage summary.

## Expected Behaviour

The `rm` command is chained via `&&` after `gh issue comment` in the same bash command that wrote the temp file via heredoc.

## Pass Criteria

- [ ] `rm` command chained with `&&` after `gh issue comment` in the same bash command
- [ ] Temp file path matches the one used for writing

## Common Mistakes

- Using a separate bash command for cleanup (may trigger `external_directory` permission check)
- Forgetting to clean up the temp file
- Running `rm` before `gh issue comment` completes
