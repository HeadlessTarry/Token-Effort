## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and writes a spec file to `docs/superpowers/specs/` but does NOT commit it. The user approves the spec. Phase 4 posts it to GitHub and applies the label.

## Expected Behaviour

- The Phase 3 handoff explicitly instructs brainstorming NOT to commit the spec file.
- Brainstorming writes the spec to `docs/superpowers/specs/` and leaves it uncommitted.
- Phase 4 locates the spec file with `ls -t docs/superpowers/specs/*.md | head -1`.
- Phase 4 posts the spec to GitHub, then removes the local file with plain `rm` (not `git rm`).
- No cleanup commit is made by `brainstorming-gh-issue` or Phase 4.

## Pass Criteria

- [ ] The Phase 3 handoff contains an explicit instruction not to commit the spec file.
- [ ] No `git commit` is made by brainstorming for the spec file.
- [ ] Phase 4 locates the spec file with `ls -t docs/superpowers/specs/*.md | head -1`.
- [ ] No cleanup commit is made after posting the spec to GitHub.
- [ ] No `git add` or `git commit` commands are run at any point by the skill or brainstorming.
