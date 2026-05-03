---
name: move-issue-status
description: Moves a GitHub issue to a named project board status column (explicit mode) or advances it one column (advance mode). All logic is delegated to a Python script — the skill is a thin wrapper. Use when you need to change an issue's project board status.
user-invocable: true
---

# 🔀 Move Issue Status

## 🌐 Overview

Moves a GitHub issue to a named project board status column (explicit mode), or advances it one column to the right if it is currently in the first column and not already in the last column (advance mode). All project board operations are executed by `move_issue_status.py`. The skill locates the script, runs it, and reports the result.

**Usage:** `/token-effort-workflow:move-issue-status <issue-number> [<status>]`

- `<issue-number>` — GitHub issue number (leading `#` stripped automatically)
- `<status>` — optional target column name (case-insensitive). Omit for advance mode.

## ⚙️ When to Use

**Use when:**
- You want to move an issue to a specific named project board column
- You want to advance an issue from its current first-column status to the next column (skips silently if not in first column, already in last column, on multiple boards, or board has no Status field)

**Do not use when:**
- You need to move multiple issues at once (run once per issue)
- You want to label or otherwise edit an issue (use `triaging-gh-issue` instead)

## Prerequisites

Python 3 and `gh` CLI must be available. `CLAUDE_PLUGIN_ROOT` must be set (injected automatically by Claude Code when running a plugin skill).

> **Important:** Do **not** use MCP tools for any operation, even if available.
> **Shell expansion:** Never use `${...}` in bash commands. Use `printenv` to read env vars.

## Process

### Phase 1 — Locate the script

The `Base directory for this skill:` header injected at the top of this skill invocation gives the directory containing `move_issue_status.py`. No bash command is needed.

The Python script path is: `<base-directory>/move_issue_status.py`

### Phase 2 — Run the script

Strip any leading `#` from the issue number. Then run:

```bash
python "<script-path>" <issue-number>
```

Or, if a target status was provided:

```bash
python "<script-path>" <issue-number> "<status>"
```

Capture stdout. Parse it as JSON.

### Phase 3 — Report

Use the `status` field from the JSON to determine output:

| `status` | Action |
|----------|--------|
| `"moved"` | Print: `Moved issue #<issue> to '<to>' in project '<project>'` |
| `"skipped"` | No output. Stop. |
| `"blocked"` | Print: `Issue #<issue> has the \`pending-review\` label — a human must remove it before this issue can be advanced.` Stop. |
| `"error"` | Report the `message` field. Stop. |

## ⚠️ Common Mistakes

- **Not reading the script path from skill metadata** — never use `${CLAUDE_PLUGIN_ROOT}` (shell expansion is blocked) or `printenv CLAUDE_PLUGIN_ROOT` (unreliable on Windows). Always derive the script path from the `Base directory for this skill:` header injected at the top of this skill invocation.
- **Reconstructing the script path from memory** — always derive the script path from the `Base directory for this skill:` header at runtime, not from a remembered or hard-coded path.
- **Printing output for skipped results** — `status == "skipped"` means stop silently. No output.
- **Treating `status == "error"` as fatal** — report the `message` and stop, but do not raise an exception or block callers.
- **Passing the `#` prefix to the script** — strip `#` before constructing the command.
- **Using MCP tools** — all GitHub operations happen inside the Python script via `gh` CLI.
- **Treating `"blocked"` like `"skipped"` (silent)** — `"blocked"` must always produce a visible message. It is not a no-op; it signals an active human checkpoint.

## Eval

- [ ] Read script path from the `Base directory for this skill:` header in the skill invocation metadata
- [ ] Constructed script path as `<base-directory>/move_issue_status.py`
- [ ] Stripped leading `#` from issue number before invoking the script
- [ ] Ran `python "<script-path>" <issue-number> [<status>]` via Bash
- [ ] Parsed stdout as JSON
- [ ] For `status == "moved"`: printed message with issue number, target status, and project name
- [ ] For `status == "skipped"`: produced no output
- [ ] For `status == "error"`: reported the `message` field
- [ ] For `status == "blocked"`: printed visible message referencing issue number and `pending-review`
- [ ] For `status == "blocked"`: did NOT treat it as `"skipped"` (silent)
- [ ] No MCP tools used
- [ ] No `${...}` shell expansion used
