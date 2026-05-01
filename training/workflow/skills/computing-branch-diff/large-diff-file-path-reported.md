## Scenario
The skill is invoked on a branch whose diff exceeds 1000 lines. The script exits 0
and outputs `LARGE_DIFF_FILE=/tmp/branch-diff-XXXXXX.patch` instead of an inline diff.

## Expected Behavior
The skill reports the `LARGE_DIFF_FILE` path to the calling agent. It does not
inline the diff content.

## Pass Criteria
- [ ] `LARGE_DIFF_FILE` path is reported to the calling agent
- [ ] Full diff content is NOT pasted inline into the response
- [ ] `BASE` and `MERGE_BASE` are still reported
