## Scenario

The skill is invoked in a GitHub Actions environment (`GITHUB_ACTIONS=true`,
`GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). After classifying the issue, the
skill must check GHA context in Phase 4 to decide whether to skip confirmation.

## Expected Behaviour

- The skill checks `GITHUB_ACTIONS` in Phase 4 using `printenv GITHUB_ACTIONS` — NOT
  any `${...}` form.
- The check succeeds and Phase 4 confirmation is skipped.
- Phase 5 writes proceed without a user prompt.

## Pass Criteria

- [ ] The bash command used in Phase 4 does NOT contain `${` shell expansion syntax.
- [ ] `printenv GITHUB_ACTIONS` (or an equivalent expansion-free command) is used.
- [ ] No confirmation prompt is shown.
- [ ] Phase 5 writes (`gh issue edit`, `gh issue comment`) proceed without user input.
