## Scenario

The propose-feature skill creates a new GitHub issue after the user approves the draft.

## Expected Behaviour

The skill writes the approved issue body to a temp file using a heredoc, creates the issue with `gh issue create --title "<title>" --body-file <temp-path>`, and cleans up the temp file — all in a single bash command. The Write tool is NOT used for temp file creation.

## Pass Criteria

- [ ] `gh issue create` called with `--body-file` flag (not `--body`)
- [ ] Single bash command with heredoc (`<< 'EOF'`)
- [ ] Write tool NOT used for temp file creation
- [ ] `&& rm` cleanup chained after `gh issue create`
- [ ] Temp file path matches between write and cleanup
- [ ] Heredoc body contains the approved issue content

## Common Mistakes

- Using `--body` with inline content (vulnerable to shell escaping)
- Using Write tool for temp file creation (triggers `external_directory` permission check in CI)
- Using separate bash commands for write/create/cleanup
- Not cleaning up temp file after issue creation
- Temp file path mismatch between write and cleanup
