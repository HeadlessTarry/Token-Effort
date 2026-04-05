## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes, the spec is posted to GitHub, and the label is applied. The session ends.

## Expected Behaviour

- At no point during the skill's execution is `git add`, `git commit`, or any other git write command run.
- All output goes to GitHub via `gh` CLI, not to the local git repository.

## Pass Criteria

- [ ] `git add` is never called.
- [ ] `git commit` is never called.
- [ ] The skill does not instruct the engineer to commit any files.
- [ ] The skill's Common Mistakes or instructions explicitly note that no files should be committed.
