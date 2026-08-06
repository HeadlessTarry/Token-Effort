# 2026-07-ci-temp-file-permission-fix

> **Status:** Active
> **Issue:** [#180 — triaging-gh-issue: agent hangs indefinitely in CI on /tmp write permission prompt](https://github.com/HeadlessTarry/Token-Effort/issues/180)
> **Date:** 2026-07-05

## Context

Four skills (`triaging-gh-issue`, `brainstorming-gh-issue`, `propose-feature`, `report-bug`) used a 3-step pattern when posting GitHub content: (1) write content to a temp file using the Write tool or separate bash command, (2) run `gh` command with `--body-file`, (3) clean up the temp file. When the Write tool was used, OpenCode evaluated an `external_directory` permission for `/tmp/*` with `action: "ask"`. In non-interactive CI environments (GitHub Actions), this prompt was never answered, causing workflows to hang indefinitely until manually cancelled.

## Decision

Consolidate the write/post/cleanup operations into a **single bash command** using a heredoc with `&&` chaining. This approach only requires the `bash` permission (already allowed in CI), avoiding the `external_directory` permission check entirely.

Pattern:
```bash
cat > "<temp-path>" << 'EOF'
<content>
EOF
gh issue comment <N> --body-file <temp-path> && rm <temp-path>
```

All four skills now use this pattern. The `&&` operator ensures cleanup only runs if the `gh` command succeeds.

## Consequences

- **Positive:** Skills complete successfully in non-interactive CI without hanging
- **Positive:** Single atomic operation reduces complexity and potential for partial failures
- **Trade-off:** If `gh` command fails, temp file is not cleaned up (OS cleans `/tmp` periodically)
- **Trade-off:** Heredoc syntax is slightly less readable than separate operations, but the benefit of avoiding permission checks outweighs this
