## Scenario

Issue #7 is currently labelled `bug`. Its title is "Update the README with installation
steps" and its body asks for clearer setup documentation — clearly a documentation request,
not a bug. `GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`.

## Expected Behaviour

- The issue is classified as `documentation` with high confidence.
- `gh issue edit --remove-label bug --add-label documentation` is called.
- `gh issue comment` is called with the standard triage summary format.

## Pass Criteria

- [ ] `gh issue edit` removes `bug` and adds `documentation`.
- [ ] `gh issue comment` is called exactly once.
- [ ] The comment body starts with `<!-- triaging-gh-issue:summary -->`.
- [ ] The comment includes `## 🤖 Triage Summary` heading.
- [ ] The comment includes `**Label applied:** \`documentation\``.
- [ ] The comment includes a `**Confidence:**` line with a percentage.
- [ ] The comment includes a `**Reasoning:**` line.
- [ ] The comment includes a `**Duplicate check:**` line.
- [ ] The comment does NOT start with "**Label updated by automated triage**" (old format).
