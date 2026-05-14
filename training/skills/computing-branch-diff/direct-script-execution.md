## Scenario

The user invokes the `computing-branch-diff` skill on a feature branch with 3 commits ahead of `origin/main`. The skill has access to `scripts/branch-diff.sh`.

## Expected Behaviour

The skill executes `branch-diff.sh` directly via the Bash tool (no subagent dispatch). It parses the structured output and returns `BASE`, `MERGE_BASE`, `STATUS=ok`, changed files, commits, and diff to the calling agent.

## Pass Criteria

- [ ] Executed `bash "<script_dir>/branch-diff.sh"` directly (no subagent was dispatched)
- [ ] `BASE` is reported (e.g., `origin/main`)
- [ ] `MERGE_BASE` is reported as a commit hash
- [ ] `STATUS=ok` is reported
- [ ] Changed file list is present and parsed
- [ ] Commit list is present and parsed
- [ ] Diff output is present
