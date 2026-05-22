## Scenario

The triaging-gh-issue skill cleaned up the temp file after posting the triage summary.

## Expected Behaviour

After `gh issue comment` succeeds, the skill runs `rm <temp-path>` to remove the temp file.

## Pass Criteria

- [ ] `rm` command executed after `gh issue comment` succeeds
- [ ] Temp file path matches the one used for writing

## Common Mistakes

- Forgetting to clean up the temp file
- Cleaning up the wrong file
- Running `rm` before `gh issue comment` completes
