## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and writes a spec file to `docs/superpowers/specs/`. The user approves the spec. Phase 4 posts it to GitHub and applies the label.

## Expected Behaviour

- Brainstorming's natural commit of the spec file is expected and allowed.
- Phase 4 runs `git rm <spec-file>` after posting to GitHub and commits the deletion.
- The cleanup commit message references the issue number.
- No other git commits are made by `brainstorming-gh-issue` directly.

## Pass Criteria

- [ ] Brainstorming's commit of the spec file is treated as expected behaviour (not flagged as an error).
- [ ] Phase 4 runs `git rm <spec-file-path>` after posting the spec to GitHub.
- [ ] A commit is made removing the spec file.
- [ ] The cleanup commit message references the issue number (e.g. `chore: remove brainstorming spec (posted to issue #28)`).
- [ ] No other `git add` or `git commit` commands are run by the skill itself.
