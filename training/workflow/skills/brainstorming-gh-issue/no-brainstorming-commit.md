## Scenario

Brainstorming reaches step 6 after the user approves the design for issue #28. Brainstorming is about to write the spec file to `docs/superpowers/specs/`.

## Expected Behaviour

- The Phase 3 handoff explicitly instructs brainstorming to write the spec file to disk but NOT commit it.
- Brainstorming writes the spec file to `docs/superpowers/specs/` and leaves it untracked.
- No `git add` or `git commit` is run during or after step 6 by brainstorming.
- The spec file is present but untracked when Phase 4 begins.
- Phase 4 locates the file with `ls -t docs/superpowers/specs/*.md | head -1`, posts it, then removes it with plain `rm`.
- No cleanup commit is made in Phase 4.

## Pass Criteria

- [ ] The Phase 3 handoff contains an explicit instruction: do not commit the spec file to git.
- [ ] No `git add` is run by brainstorming at step 6 or after.
- [ ] No `git commit` is run by brainstorming at step 6 or after.
- [ ] The spec file is present in `docs/superpowers/specs/` but untracked (`git status` shows it as untracked, not staged or committed).
- [ ] No commit is made in Phase 4 for the spec file removal.
