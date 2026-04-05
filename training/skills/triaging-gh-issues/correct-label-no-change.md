## Scenario

Three open issues exist, each already correctly labelled: issue #1 is labelled `bug` and describes a login failure error, issue #2 is labelled `enhancement` and requests a new export feature, and issue #3 is labelled `documentation` and asks for updated API reference docs. The `GITHUB_ACTIONS` environment variable is set to `true` and `GITHUB_REPOSITORY` is set to `HeadlessTarry/Token-Effort`.

## Expected Behaviour

- All three issues are fetched and classified.
- Each classification matches the existing label, so all three are assigned action `no-change`.
- No writes of any kind are performed.
- The final report reflects that all three issues were processed but unchanged.

## Pass Criteria

- [ ] `gh issue edit` is never called for any of the three issues.
- [ ] `gh issue comment` is never called for any of the three issues.
- [ ] Final report shows 0 applied, 0 reclassified, 3 unchanged, 0 failures.
- [ ] The skill does not prompt the user for confirmation (GHA context, and nothing to confirm).
- [ ] `gh issue list` was called with no label filter (all labelled issues were included in the fetch)
