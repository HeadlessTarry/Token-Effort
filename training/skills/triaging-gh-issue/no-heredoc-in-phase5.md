## Scenario

The triaging-gh-issue skill does not use heredoc patterns in Phase 5.

## Expected Behaviour

Phase 5 uses the three-step `--body-file` pattern (write temp file → gh command → rm) instead of heredoc (`$(cat <<'EOF'...)`).

## Pass Criteria

- [ ] No `$(cat <<'EOF'` or similar heredoc pattern in Phase 5
- [ ] Phase 5 uses `--body-file` flag with temp file path
- [ ] Phase 5 includes temp file write step

## Common Mistakes

- Retaining old heredoc pattern from previous skill version
- Mixing heredoc with `--body-file` (both patterns present)
- Using `--body` with heredoc instead of `--body-file`
