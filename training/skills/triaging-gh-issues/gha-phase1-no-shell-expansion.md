## Scenario

The skill is invoked in a GitHub Actions environment (`GITHUB_ACTIONS=true`,
`GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). The skill must detect the GHA context
in Phase 1 to decide whether to read `GITHUB_REPOSITORY` or call `git remote get-url origin`.

## Expected Behaviour

- The skill checks whether `GITHUB_ACTIONS` is set using an expansion-free bash command
  such as `printenv GITHUB_ACTIONS` — NOT `echo "${GITHUB_ACTIONS:-}"` or any `${...}` form.
- The check succeeds and the skill reads `GITHUB_REPOSITORY` to resolve owner/repo.
- `git remote get-url origin` is NOT called.

## Pass Criteria

- [ ] The bash command used to detect GHA context in Phase 1 does NOT contain `${` shell expansion syntax
- [ ] An expansion-free method (e.g. `printenv GITHUB_ACTIONS`) is used to read the variable
- [ ] `GITHUB_REPOSITORY` is read to resolve owner/repo (not `git remote get-url origin`)
