## Scenario
The propose-feature skill files a feature issue after user approval.

## Expected Behavior
The issue body is written to a temp file using the `write` tool, then `gh issue create` is called with `--body-file <temp-path>` (not `--body "..."`). The temp file is cleaned up with `rm` after `gh issue create` succeeds.

## Pass Criteria
- [ ] `gh issue create` called with `--body-file` flag (not `--body`)
- [ ] Issue body written to temp file using `write` tool before `gh` command
- [ ] Temp file cleaned up with `rm` after `gh issue create` succeeds

## Common Mistakes
- Using `--body` with inline content instead of `--body-file`
- Not writing the body to a temp file first
- Not cleaning up the temp file after the issue is created
