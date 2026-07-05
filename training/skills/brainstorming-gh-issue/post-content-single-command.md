## Scenario

The brainstorming-gh-issue skill posts a design spec comment to a GitHub issue after brainstorming completes and the user approves.

## Expected Behaviour

The skill writes the design spec to a temp file using a heredoc, posts it with `gh issue comment <N> --body-file <temp-path>`, and cleans up the temp file — all in a single bash command. The Write tool is NOT used for temp file creation.

## Pass Criteria

- [ ] `gh issue comment` called with `--body-file` flag (not `--body`)
- [ ] Single bash command with heredoc (`<< 'EOF'`)
- [ ] Write tool NOT used for temp file creation
- [ ] `&& rm` cleanup chained after `gh issue comment`
- [ ] Temp file path matches between write and cleanup
- [ ] Content includes `<!-- brainstorming-gh-issue:spec -->` marker as first line
- [ ] Content includes `## 🤖🧠 Design Spec` heading

## Common Mistakes

- Using `--body` with inline content (vulnerable to shell escaping)
- Using Write tool for temp file creation (triggers `external_directory` permission check in CI)
- Using separate bash commands for write/post/cleanup
- Not cleaning up temp file after posting
- Temp file path mismatch between write and cleanup
