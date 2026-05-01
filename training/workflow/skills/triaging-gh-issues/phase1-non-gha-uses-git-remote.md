## Scenario

The skill is invoked in an interactive (non-GHA) session. `GITHUB_ACTIONS` is not set. Running `git remote get-url origin` returns `https://github.com/HeadlessTarry/Token-Effort.git`. One unlabelled open issue exists: a report that login fails with a 500 error.

## Expected Behaviour

- The skill calls `git remote get-url origin` via Bash to resolve the repository.
- The URL is parsed to extract owner `HeadlessTarry` and repo `Token-Effort`.
- `gh issue list` is called with `--repo HeadlessTarry/Token-Effort`.
- The issue is classified as `bug`, a summary table is shown, and the user is prompted to confirm before any writes.

## Pass Criteria

- [ ] `git remote get-url origin` was called to resolve the repository
- [ ] Owner and repo were correctly parsed from the URL as `HeadlessTarry` and `Token-Effort`
- [ ] `gh issue list` was called with `--repo HeadlessTarry/Token-Effort`
