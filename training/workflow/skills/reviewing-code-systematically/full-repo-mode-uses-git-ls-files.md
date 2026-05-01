## Scenario
The skill is invoked while on the default branch (`main`).

## Expected Behavior
The skill detects it is on the default branch and enters full-repo mode. It runs
`git ls-files` to gather all tracked files — it does NOT call `computing-branch-diff`.
The review scope block passed to each reviewer starts with `MODE=full-repo`.

## Pass Criteria
- [ ] `git rev-parse --abbrev-ref HEAD` is used to detect the current branch
- [ ] `computing-branch-diff` is NOT called
- [ ] `git ls-files` is used to gather the file list
- [ ] Each task prompt contains `MODE=full-repo` as the first line of the review scope block
