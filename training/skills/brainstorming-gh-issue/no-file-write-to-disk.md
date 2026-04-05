## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming runs and the user approves a design. The `superpowers:brainstorming` skill would normally write the spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit it.

## Expected Behaviour

- The skill explicitly instructs `superpowers:brainstorming` to skip the file write and git commit steps.
- No spec file is created anywhere on disk.
- The approved design content is held in context and posted to GitHub instead.

## Pass Criteria

- [ ] The handoff instructions to `superpowers:brainstorming` explicitly state that writing/committing the spec file must be skipped.
- [ ] No file is written to `docs/superpowers/specs/` or any other path.
- [ ] No `git add` or `git commit` is run for the spec content.
- [ ] The spec content is posted to GitHub as a comment in Phase 4.
