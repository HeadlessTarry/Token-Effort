## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the user approves the design. In Phase 5a (spec posting), the skill posts the finalized spec as a GitHub comment.

## Expected Behaviour

- The skill writes the spec to a temp file, posts it with `gh issue comment --body-file`, and cleans up — all in a single bash command using a heredoc with `&&` chaining.
- The Write tool is NOT used for temp file creation.

## Pass Criteria

- [ ] `gh issue comment` is called with `--body-file` (not `--body`).
- [ ] Write, post, and cleanup are in a single bash command using heredoc.
- [ ] The temp file is cleaned up via `&& rm` after posting.

## Common Mistakes

- Using `--body` with inline spec content instead of `--body-file`.
- Using the Write tool for temp file creation (triggers `external_directory` permission check in CI).
- Using separate bash commands for write/post/cleanup.
- Not cleaning up the temp file after posting.
