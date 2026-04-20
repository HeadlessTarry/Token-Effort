---
name: move-issue-status
description: Moves a GitHub issue to a named project board status column (explicit mode) or advances it one column (advance mode). All logic is delegated to a Python script — the skill is a thin wrapper. Use when you need to change an issue's project board status.
user-invocable: true
---

# 🔀 Move Issue Status

## 🌐 Overview

Moves a GitHub issue to a named project board status column (explicit mode), or advances it one column to the right if it is currently in the first column (advance mode). All project board operations are executed by `move_issue_status.py`. The skill locates the script, runs it, and reports the result.

**Usage:** `/token-effort:move-issue-status <issue-number> [<status>]`

- `<issue-number>` — GitHub issue number (leading `#` stripped automatically)
- `<status>` — optional target column name (case-insensitive). Omit for advance mode.

## ⚙️ When to Use

**Use when:**
- You want to move an issue to a specific named project board column
- You want to advance an issue from its current first-column status to the next column

**Do not use when:**
- You need to move multiple issues at once (run once per issue)
- You want to label or otherwise edit an issue (use `triaging-gh-issues` instead)

## Prerequisites

Python 3 and `gh` CLI must be available. `CLAUDE_PLUGIN_ROOT` must be set (injected automatically by Claude Code when running a plugin skill).

> **Important:** Do **not** use MCP tools for any operation, even if available.
> **Shell expansion:** Never use `${...}` in bash commands. Use `printenv` to read env vars.

## Process

### Phase 1 — Locate the script

Run:

```bash
printenv CLAUDE_PLUGIN_ROOT
```

The Python script path is: `<output>/skills/move-issue-status/move_issue_status.py`

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
| `"error"` | Report the `message` field. Stop. |

## ⚠️ Common Mistakes

- **Not reading `CLAUDE_PLUGIN_ROOT` via `printenv`** — never use `${CLAUDE_PLUGIN_ROOT}` (shell expansion is blocked). Always run `printenv CLAUDE_PLUGIN_ROOT` first.
- **Reconstructing the script path from memory** — always derive the script path from the `printenv CLAUDE_PLUGIN_ROOT` output at runtime.
- **Printing output for skipped results** — `status == "skipped"` means stop silently. No output.
- **Treating `status == "error"` as fatal** — report the `message` and stop, but do not raise an exception or block callers.
- **Passing the `#` prefix to the script** — strip `#` before constructing the command.
- **Using MCP tools** — all GitHub operations happen inside the Python script via `gh` CLI.

## Eval

- [ ] Called `printenv CLAUDE_PLUGIN_ROOT` to locate the script
- [ ] Constructed script path as `<CLAUDE_PLUGIN_ROOT>/skills/move-issue-status/move_issue_status.py`
- [ ] Stripped leading `#` from issue number before invoking the script
- [ ] Ran `python "<script-path>" <issue-number> [<status>]` via Bash
- [ ] Parsed stdout as JSON
- [ ] For `status == "moved"`: printed message with issue number, target status, and project name
- [ ] For `status == "skipped"`: produced no output
- [ ] For `status == "error"`: reported the `message` field
- [ ] No MCP tools used
- [ ] No `${...}` shell expansion used
