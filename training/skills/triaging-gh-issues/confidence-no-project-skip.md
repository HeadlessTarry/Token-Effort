## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). One unlabelled open issue (#60) has the title "Login fails with 500 error every time" and a body with a clear error message and reproduction steps. Classification is unambiguously `bug` with confidence above 80%.

`gh project list` returns an empty list — there are no GitHub projects associated with this owner.

## Expected Behaviour

- The issue is classified as `bug`, action `apply`, confidence > 80%.
- Label `bug` is applied via `gh issue edit --add-label bug`.
- Because no project is found, the project status step is skipped entirely. No `gh project item-edit` call is made and no error is reported.

## Pass Criteria

- [ ] `gh issue edit --add-label bug` is called for issue #60.
- [ ] `gh project item-edit` is NOT called.
- [ ] No error is reported relating to projects.
- [ ] Final report shows 1 applied, 0 reclassified, 0 unchanged, 0 failures.
