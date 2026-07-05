## Scenario

The triaging-gh-issue skill uses a heredoc within a single bash command for the temp file write/post/cleanup pattern in Phase 5.

## Expected Behaviour

Phase 5 uses a single bash command with a heredoc to write the temp file, post via `--body-file`, and clean up with `&& rm`. The Write tool is NOT used for temp file creation.

## Pass Criteria

- [ ] Phase 5 uses a heredoc (`<< 'EOF'`) within a bash command
- [ ] Phase 5 uses `--body-file` flag with temp file path
- [ ] Write, post, and cleanup are in a single bash command (not separate operations)

## Common Mistakes

- Using the Write tool for temp file creation (triggers `external_directory` permission check in CI)
- Using separate bash commands for write, post, and cleanup
- Using `--body` with inline content instead of `--body-file`
