## Scenario

The report-bug skill files a bug issue after user approval. The issue body is written to a temporary file and submitted via `--body-file`.

## Expected Behaviour

- The issue body is written to a temp file and submitted via `--body-file`, and cleaned up — all in a single bash command using a heredoc with `&&` chaining.
- The Write tool is NOT used for temp file creation.

## Pass Criteria

- [ ] `gh issue create` called with `--body-file` flag (not `--body`).
- [ ] Write, create, and cleanup consolidated into a single bash command using heredoc.
- [ ] Temp file cleaned up with `&& rm` after `gh issue create` succeeds.

## Common Mistakes

- Using `--body` with inline content (vulnerable to shell escaping).
- Using the Write tool for temp file creation (triggers `external_directory` permission check in CI).
- Using separate bash commands for write/create/cleanup.
- Not cleaning up temp file after submission.
