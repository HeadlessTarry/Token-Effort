## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the user approves the design. In Phase 5a (spec posting), the skill posts the finalized spec as a GitHub comment.

## Expected Behaviour

- The skill posts the spec as a GitHub comment using `gh issue comment` with `--body-file` pointing to a temp file, not `--body` with inline content.
- The spec content is written to a temporary file before posting.
- The temp file is cleaned up after the comment is posted.

## Pass Criteria

- [ ] `gh issue comment` is called with `--body-file` (not `--body`).
- [ ] Spec content is written to a temp file before posting.
- [ ] The temp file is cleaned up after posting.

## Common Mistakes

- Using `--body` with inline spec content instead of `--body-file` — this fails for large specs due to shell argument length limits and makes the command harder to read.
- Forgetting to write the spec to a temp file before calling `gh issue comment`.
- Not cleaning up the temp file after posting, leaving orphaned files in the working directory.
