## Scenario

The skill is invoked in a GitHub Actions environment (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). The call to `gh issue list` returns an empty array — there are no open issues in the repository.

## Expected Behaviour

- The skill calls `gh issue list` with `--state open`.
- The response is an empty list (zero issues).
- The skill reports "No open issues found." and stops immediately.
- `gh search issues` is never called (no issues to process).
- `gh issue edit` is never called.
- No summary table is displayed and no confirmation is requested.

## Pass Criteria

- [ ] `gh issue list` is called exactly once
- [ ] Execution stops after receiving an empty issue list
- [ ] The output includes "No open issues found." (or equivalent message)
- [ ] `gh search issues` is never called
- [ ] `gh issue edit` is never called
