## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). One unlabelled open issue (#70) has the title "Add CSV export to the reports page" and a clear feature request body. Classification is unambiguously `enhancement` with confidence above 80%.

`gh project list` (or querying project items) reveals that issue #70 appears in two different GitHub projects: project 1 ("Roadmap") and project 2 ("Q3 Sprint").

## Expected Behaviour

- The issue is classified as `enhancement`, action `apply`, confidence > 80%.
- Label `enhancement` is applied via `gh issue edit --add-label enhancement`.
- Because the issue belongs to multiple projects, the project status step is skipped entirely. `gh project item-edit` is NOT called and no error is reported.

## Pass Criteria

- [ ] `gh issue edit --add-label enhancement` is called for issue #70.
- [ ] `gh project item-edit` is NOT called.
- [ ] No error is reported relating to projects.
- [ ] Final report shows 1 applied, 0 reclassified, 0 unchanged, 0 failures.
