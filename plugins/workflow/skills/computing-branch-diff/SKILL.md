---
name: computing-branch-diff
description: Use when a subagent needs to know what changed on the current branch relative to its base — e.g. before a code review, changelog generation, or impact analysis.
---

# Computing a Branch Diff

## ⛔ Dispatcher — Act on This Before Reading Further

**Do not execute any step below.** Your only action is to spawn a Haiku subagent via the `Agent` tool with `model: haiku`. Embed all instructions under "Subagent Instructions" below verbatim as the subagent prompt — the script path in Step 1 is already hardcoded (Claude Code substitutes `CLAUDE_PLUGIN_ROOT` at plugin load time, so the path in Step 1 is correct as-shipped). This skill uniquely requires noting the resolved path because it delegates to a companion shell script; skills without external scripts omit this clause. Report the subagent's result to the user without modification.

## 📋 Subagent Instructions — Pass Verbatim, Do Not Execute Directly

### Overview

Produces the merge-base, full diff, changed file list, and commit list for the current branch relative to its base. Delegates all logic to a script — one Bash call, no approval chain. Handles base-branch detection, upstream fallback, `LARGE_DIFF_FILE` offloading, and `STATUS=empty` for branches with no unique commits.

This skill ships with two companion scripts — `branch-diff.sh` (Bash) and `branch-diff.ps1` (PowerShell) — which must be present in the same installed directory.

### When NOT to Use

- **Detached HEAD** — `git rev-parse --abbrev-ref HEAD` returns `HEAD`; base branch detection will likely fail with exit 1.
- **Shallow clone** — merge-base computation may be incorrect or error; run `git fetch --unshallow` first.
- **No remotes configured** — base branch detection steps 2 and 3 require `origin`; if absent, exit 1 is expected.

### Steps

### 1. Determine the script path

The scripts live alongside this file. Resolve the directory:

```bash
# Use the plugin root (substituted by Claude Code at runtime):
SKILL_DIR="${CLAUDE_PLUGIN_ROOT}/skills/computing-branch-diff"

if [ ! -d "$SKILL_DIR" ]; then
  echo "ERROR: skill scripts not found at $SKILL_DIR." >&2
  exit 2
fi
```

### 2. Detect OS and run the appropriate script

```bash
# In bash (Linux, macOS, Git Bash on Windows):
bash "$SKILL_DIR/branch-diff.sh"

# In PowerShell (Windows native):
& "$SKILL_DIR/branch-diff.ps1"
```

**OS detection** — when in doubt, prefer the bash script. Use PowerShell only when the session shell is explicitly PowerShell (i.e. `pwsh` or `powershell`). Auto-detection from bash is unreliable; prefer explicit invocation using the two forms above.

### 3. Handle the exit code

| Exit code | Meaning | Action |
|-----------|---------|--------|
| `0` | Success | Parse and report the output (see below) |
| `1` | Base branch not detected | Ask the user: "I could not detect the base branch. Please specify the branch to diff against (e.g. `origin/main`)." |
| `2` | Unexpected error | Report stderr to the user verbatim |

### 4. Parse and report output

The script writes structured output to stdout:

```
BASE=origin/main
MERGE_BASE=abc123...
STATUS=ok            # or "empty" if no unique commits
MESSAGE=...          # present only when STATUS=empty; human-readable explanation

--- CHANGED_FILES ---
path/to/file1
path/to/file2

--- COMMITS ---
abc123 commit message

--- DIFF ---
[full diff, or LARGE_DIFF_FILE=<platform temp path>/branch-diff-XXXXX.patch if > 1000 lines]
# bash: /tmp/branch-diff-XXXXXX.patch
# PowerShell: %TEMP%\tmpXXXX.tmp.patch
```

The 1000-line threshold exists to avoid exceeding agent context limits — diffs above this size are written to a temp file instead of inlined.

**Always report `BASE` and `MERGE_BASE`** so the calling agent can use them for further operations (e.g. `git show "$MERGE_BASE":path/to/file`).

When `STATUS=empty`, report: "No commits on this branch relative to `$BASE`. Diff is empty." Do not attempt further processing.

When `LARGE_DIFF_FILE=...` appears, report the path — do not inline the diff.

### Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running on the default branch itself | `STATUS=empty` is expected — report "no unique commits" and stop; do not treat it as an error |
| Using `$0` to resolve `SKILL_DIR` inside a subagent | `$0` is unreliable in eval contexts; use `${CLAUDE_PLUGIN_ROOT}/skills/computing-branch-diff` |
| Inlining the diff when `LARGE_DIFF_FILE` is set | Report the file path only; inlining can exceed context limits |

### Eval

**Scenario A — normal branch:** Subagent is on a feature branch with 3 commits ahead of `origin/main`.
- [ ] `BASE` and `MERGE_BASE` are reported
- [ ] Changed file list is present
- [ ] Commit list is present

**Scenario B — on default branch:** Subagent is on `main` itself.
- [ ] `STATUS=empty` is reported
- [ ] Processing stops without further action
- [ ] No error is raised

**Scenario C — large diff:** Branch diff exceeds 1000 lines.
- [ ] `LARGE_DIFF_FILE` path is reported
- [ ] Full diff is not pasted into the response
