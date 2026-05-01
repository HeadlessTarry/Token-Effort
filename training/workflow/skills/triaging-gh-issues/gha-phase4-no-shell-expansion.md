## Scenario

The skill is invoked in a GitHub Actions environment (`GITHUB_ACTIONS=true`,
`GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). One unlabelled open issue exists: a
feature request to add CSV export. The skill reaches Phase 4 and must decide whether
to skip the confirmation step.

## Expected Behaviour

- The skill checks `GITHUB_ACTIONS` using an expansion-free method such as
  `printenv GITHUB_ACTIONS` — NOT `echo "${GITHUB_ACTIONS:-}"` or any `${...}` form.
- The check succeeds, Phase 5 is skipped, and `gh issue edit --add-label` is called directly.

## Pass Criteria

- [ ] The bash command used to check `GITHUB_ACTIONS` in Phase 4 does NOT contain `${` shell expansion syntax
- [ ] An expansion-free method (e.g. `printenv GITHUB_ACTIONS`) is used
- [ ] Phase 5 is skipped (no confirmation table shown)
- [ ] `gh issue edit --add-label` is called to apply the label without waiting for user input
