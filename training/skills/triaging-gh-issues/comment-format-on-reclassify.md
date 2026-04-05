## Scenario

One open issue is currently labelled `bug`. Its title is "Update the README with installation steps" and its body asks for clearer setup documentation — clearly a documentation request, not a bug. The `GITHUB_ACTIONS` environment variable is set to `true` and `GITHUB_REPOSITORY` is set to `HeadlessTarry/Token-Effort`.

## Expected Behaviour

- The issue is classified as `documentation`.
- Because the current label (`bug`) is clearly wrong, the action is `reclassify`.
- `gh issue edit --remove-label bug --add-label documentation` is called to update the label.
- `gh issue comment` is called with a comment that begins with "**Label updated by automated triage**" and mentions both the old label (`bug`) and the new label (`documentation`).

## Pass Criteria

- [ ] `gh issue edit` is called to set the label to `documentation`.
- [ ] `gh issue comment` is called exactly once for this issue.
- [ ] The comment text starts with "**Label updated by automated triage**".
- [ ] The comment text references the old label `bug`.
- [ ] The comment text references the new label `documentation`.
- [ ] Final report shows 0 applied, 1 reclassified, 0 unchanged, 0 failures.
