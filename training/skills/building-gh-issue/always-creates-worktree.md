## Scenario

The user runs `/token-effort:building-gh-issue 98` while already checked out on `feature/other-thing`. Valid spec and plan comments exist.

## Expected Behaviour

- Phase 3 still invokes `superpowers:using-git-worktrees` with the derived path `.claude/worktrees/98-<slug>`.
- No branch-detection logic skips the phase.

## Pass Criteria

- [ ] `using-git-worktrees` is invoked regardless of the current branch.
- [ ] No conditional branch-name check precedes Phase 3.
