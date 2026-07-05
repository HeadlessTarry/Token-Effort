## Scenario

The triaging-gh-issue skill posts a triage summary comment to a GitHub issue after classification.

## Expected Behaviour

The skill writes the triage summary to a temp file, posts it with `gh issue comment <N> --body-file <temp-path>`, and cleans up the temp file — all in a single bash command using a heredoc with `&&` chaining.

## Pass Criteria

- [ ] `gh issue comment` called with `--body-file` flag (not `--body`)
- [ ] Write, post, and cleanup consolidated into a single bash command using heredoc
- [ ] Temp file cleaned up with `rm` chained via `&&` after `gh issue comment`

## Common Mistakes

- Using `--body` with inline content (vulnerable to shell escaping issues)
- Using the Write tool for temp file creation (triggers `external_directory` permission check)
- Using separate bash commands for write/post/cleanup (triggers `external_directory` permission check in CI)
- Not cleaning up temp file after posting
