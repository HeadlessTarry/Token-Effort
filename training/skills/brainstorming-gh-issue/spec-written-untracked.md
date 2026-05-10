## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming runs its full process through step 8, writes the spec to `docs/superpowers/specs/2026-04-07-my-feature-design.md`, but does NOT commit it (the file is untracked). The user approves the written spec.

## Expected Behaviour

- The Phase 4 handoff instructs brainstorming to stop after step 8 and not invoke `writing-plans` (step 9).
- The Phase 4 handoff instructs brainstorming not to commit the spec file.
- Phase 5 locates the spec file using `ls -t docs/superpowers/specs/*.md | head -1`.
- Phase 5 reads the spec file content before constructing the GitHub comment.
- Phase 5 posts the spec file content to GitHub as a comment.
- Phase 5 deletes the local spec file with plain `rm` (not `git rm`).
- No commit is made for the spec file deletion.

## Pass Criteria

- [ ] The Phase 4 handoff instructs brainstorming not to invoke `writing-plans` after step 8.
- [ ] The Phase 4 handoff instructs brainstorming not to commit the spec file.
- [ ] Phase 5 runs `ls -t docs/superpowers/specs/*.md | head -1` to locate the spec file.
- [ ] Phase 5 reads the spec file before posting — content comes from the file, not reconstructed from memory.
- [ ] `gh issue comment` is called with the spec file's content.
- [ ] Phase 5 removes the spec file with plain `rm`, not `git rm`.
- [ ] No commit is made removing the spec file.
