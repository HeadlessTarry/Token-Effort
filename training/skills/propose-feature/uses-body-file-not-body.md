## Scenario
The propose-feature skill files a feature issue after user approval.

## Expected Behavior
The issue body is written to a temp file, posted with `gh issue create --body-file`, and cleaned up — all in a single bash command using a heredoc with `&&` chaining. The Write tool is NOT used.

## Pass Criteria
- [ ] `gh issue create` called with `--body-file` flag (not `--body`)
- [ ] Write, create, and cleanup consolidated into a single bash command using heredoc
- [ ] Temp file cleaned up with `&& rm` after `gh issue create` succeeds

## Common Mistakes
- Using `--body` with inline content instead of `--body-file`
- Using the Write tool for temp file creation (triggers `external_directory` permission check in CI)
- Using separate bash commands for write/create/cleanup
- Not cleaning up the temp file after the issue is created
