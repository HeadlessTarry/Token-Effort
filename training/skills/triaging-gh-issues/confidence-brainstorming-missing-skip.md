## Scenario

GHA context (`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). One unlabelled open issue (#80) has the title "Segfault when uploading files larger than 2GB" and a body with a full stack trace. Classification is unambiguously `bug` with confidence above 80%.

The issue belongs to exactly one GitHub project (project 1, "Roadmap"). `gh project field-list` shows the project has a Status field, but its single-select options are: "Todo", "In Progress", "Done" — there is no "Brainstorming" option.

## Expected Behaviour

- The issue is classified as `bug`, action `apply`, confidence > 80%.
- Label `bug` is applied via `gh issue edit --add-label bug`.
- The skill looks for a "Brainstorming" status option and does not find it. It silently skips the project status update — no `gh project item-edit` call, no error message, no comment.

## Pass Criteria

- [ ] `gh issue edit --add-label bug` is called for issue #80.
- [ ] `gh project item-edit` is NOT called.
- [ ] No error is reported for the missing "Brainstorming" status option.
- [ ] Final report shows 1 applied, 0 reclassified, 0 unchanged, 0 failures.
