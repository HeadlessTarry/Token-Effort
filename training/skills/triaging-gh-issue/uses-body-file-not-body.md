## Scenario

The triaging-gh-issue skill posts a triage summary comment to a GitHub issue after classification.

## Expected Behaviour

The skill writes the triage summary to a temp file first, then uses `gh issue comment <N> --body-file <temp-path>` to post it. The temp file is cleaned up after posting.

## Pass Criteria

- [ ] `gh issue comment` called with `--body-file` flag (not `--body`)
- [ ] Triage summary written to temp file using `write` tool before `gh` command
- [ ] Temp file cleaned up with `rm` after `gh issue comment` succeeds

## Common Mistakes

- Using `--body` with inline content (vulnerable to shell escaping issues)
- Using heredoc (`$(cat <<'EOF'...)`) instead of temp file + `--body-file`
- Not writing to temp file first
- Not cleaning up temp file after posting
