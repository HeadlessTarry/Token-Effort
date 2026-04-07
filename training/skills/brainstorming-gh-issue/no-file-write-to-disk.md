## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming runs its full process through step 8, writes the spec to `docs/superpowers/specs/2026-04-07-my-feature-design.md`, and commits it. The user approves the written spec.

## Expected Behaviour

- The Phase 3 handoff instructs brainstorming to stop after step 8 and not invoke `writing-plans` (step 9).
- Phase 4 locates the spec file brainstorming committed using `ls -t docs/superpowers/specs/*.md | head -1`.
- Phase 4 reads the spec file content before constructing the GitHub comment.
- Phase 4 posts the spec file content to GitHub as a comment.
- Phase 4 deletes the local spec file with `git rm` and commits the deletion.

## Pass Criteria

- [ ] The Phase 3 handoff instructs brainstorming not to invoke `writing-plans` after step 8.
- [ ] Phase 4 runs `ls -t docs/superpowers/specs/*.md | head -1` to locate the spec file.
- [ ] Phase 4 reads the spec file before posting — content comes from the file, not reconstructed from memory.
- [ ] `gh issue comment` is called with the spec file's content.
- [ ] `git rm` is run on the spec file after posting to GitHub.
- [ ] A commit is made removing the spec file, with a message referencing the issue number.
