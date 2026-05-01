## Scenario

The user runs `/token-effort:building-gh-issue 98`. Valid spec and plan comments exist. `superpowers:using-git-worktrees` fails (e.g. a Git error or path conflict).

## Expected Behaviour

- Phase 3 invokes `using-git-worktrees`, which fails.
- The build stops immediately with a clear error.
- No execution skill is invoked.

## Pass Criteria

- [ ] Build stops after Phase 3 failure.
- [ ] Execution skill is NOT invoked.
- [ ] No warning-and-continue pattern is used.
