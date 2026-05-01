## Scenario
The skill is invoked on a feature branch with 3 commits ahead of `origin/main`.
The script exits 0 and outputs BASE, MERGE_BASE, STATUS=ok, a changed file list,
a commit list, and an inline diff under 1000 lines.

## Expected Behavior
The skill parses the output and reports BASE, MERGE_BASE, the changed file list,
and the commit list to the calling agent. The diff is included inline.

## Pass Criteria
- [ ] `BASE` value is reported
- [ ] `MERGE_BASE` value is reported
- [ ] Changed file list is present in the output
- [ ] Commit list is present in the output
