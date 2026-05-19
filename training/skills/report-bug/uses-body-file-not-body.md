## Scenario

The report-bug skill files a bug issue after user approval. The issue body is written to a temporary file and submitted via `--body-file`.

## Expected Behaviour

- The issue body is written to a temp file using the `write` tool before calling `gh issue create`.
- `gh issue create` is called with `--body-file <temp-path>` (not `--body "..."`).
- The temp file is cleaned up with `rm` after `gh issue create` succeeds.

## Pass Criteria

- [ ] `gh issue create` called with `--body-file` flag (not `--body`).
- [ ] Issue body written to temp file using `write` tool before `gh` command.
- [ ] Temp file cleaned up with `rm` after `gh issue create` succeeds.

## Common Mistakes

- Using `--body` with inline content (vulnerable to shell escaping).
- Not writing to temp file first.
- Not cleaning up temp file after submission.
