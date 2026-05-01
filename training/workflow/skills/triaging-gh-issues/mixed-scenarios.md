## Scenario

Four open issues exist: #10 has no label and describes a request to add OAuth login support (clearly an enhancement), #11 is labelled `bug` and describes the app crashing when a null value is passed (correctly labelled), #12 is labelled `enhancement` but its body describes a segfault on startup with a full stack trace (unambiguously a bug), and #13 is labelled `enhancement` but its body mentions both adding a new settings page and documenting the configuration options (ambiguous). The `GITHUB_ACTIONS` environment variable is NOT set. The user approves the proposed changes.

## Expected Behaviour

- #10 is classified as `enhancement`, action `apply`; added to summary table.
- #11 is classified as `bug`, label already correct, action `no-change`; excluded from summary table.
- #12 is classified as `bug`, label clearly wrong, action `reclassify`; added to summary table.
- #13 classification is ambiguous relative to current label, action `no-change`; excluded from summary table.
- Summary table shows only #10 and #12. User approves.
- `gh issue edit --add-label` called for #10 (apply `enhancement`) and `gh issue edit --remove-label --add-label` for #12 (reclassify to `bug`). `gh issue comment` called for #12 only.

## Pass Criteria

- [ ] Summary table contains exactly #10 and #12, and does not contain #11 or #13.
- [ ] `gh issue edit --add-label` is called for #10 with label `enhancement`.
- [ ] `gh issue edit` is called for #12 with label `bug`.
- [ ] `gh issue edit` is never called for #11 or #13.
- [ ] `gh issue comment` is called for #12 and never called for #10, #11, or #13.
- [ ] Final report shows 1 applied, 1 reclassified, 2 unchanged, 0 failures.
