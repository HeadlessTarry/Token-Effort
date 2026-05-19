## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the spec is posted as a GitHub comment in Phase 5.

## Expected Behaviour

- The skill posts the spec as a GitHub comment using `gh issue comment` with `--body-file` pointing to a temp file, not `--body` with inline content.
- The spec content is written to a temporary file before posting.
- The temp file is cleaned up after the comment is posted.

## Pass Criteria

- [ ] `gh issue comment` is called with `--body-file` (not `--body`).
- [ ] Spec content is written to a temp file before posting.
- [ ] The temp file is cleaned up after posting.
