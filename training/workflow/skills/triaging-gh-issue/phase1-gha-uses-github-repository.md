## Scenario

The skill is invoked in a GitHub Actions environment. `GITHUB_ACTIONS` is set to `true` and `GITHUB_REPOSITORY` is set to `HeadlessTarry/Token-Effort`. One unlabelled open issue exists: a feature request to add dark mode support.

## Expected Behaviour

- The skill reads `GITHUB_REPOSITORY` to resolve the owner (`HeadlessTarry`) and repo (`Token-Effort`).
- `git remote get-url origin` is NOT called.
- `gh issue list` is called with `--repo HeadlessTarry/Token-Effort`.
- The issue is classified as `enhancement` and labelled directly (GHA context, no confirmation).

## Pass Criteria

- [ ] `GITHUB_REPOSITORY` env var was read to resolve the owner and repo (not `git remote get-url origin`)
- [ ] `git remote get-url origin` was NOT called
- [ ] `gh issue list` was called with `--repo HeadlessTarry/Token-Effort`
