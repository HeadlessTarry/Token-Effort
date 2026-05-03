## Scenario

The skill is invoked in a GitHub Actions environment. `GITHUB_ACTIONS` is set to `true` but `GITHUB_REPOSITORY` is not set (empty or absent). Several open issues exist in the repository.

## Expected Behaviour

- The skill detects that `GITHUB_REPOSITORY` is missing or empty.
- Execution stops immediately with an error message indicating the repository could not be determined.
- `git remote get-url origin` is NOT called as a fallback.
- `gh issue list` is never called.

## Pass Criteria

- [ ] Execution stopped without calling `gh issue list`
- [ ] An error was reported indicating `GITHUB_REPOSITORY` was missing or could not be read
- [ ] `git remote get-url origin` was NOT called
