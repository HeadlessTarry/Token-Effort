## Scenario

The user runs `/token-effort:building-gh-issue 98` while `main` is checked out. Issue #98 has valid spec and plan comments.

## Expected Behaviour

- Phase 2 moves the issue to Building status.
- Phase 3 invokes `superpowers:using-git-worktrees` with worktree path `.claude/worktrees/98-building-gh-issue-commits-directly-to-main-no` before any execution skill is called.
- Phase 4 (execution) does not begin until Phase 3 completes.

## Pass Criteria

- [ ] `using-git-worktrees` is invoked before the execution skill.
- [ ] Worktree path begins with `.claude/worktrees/98-`.
- [ ] Execution skill is not invoked until after Phase 3 completes.
