---
name: computing-branch-diff
description: Use when a subagent needs to know what changed on the current branch relative to its base — e.g. before a code review, changelog generation, or impact analysis. Covers upstream detection, remote HEAD fallback, and merge-base computation.
---

# Computing a Branch Diff

## Overview

Produces the merge base, full diff, changed file list, and commit list for the current branch relative to its base. Delegates all logic to a script — one Bash call, no approval chain.

## Steps

### 1. Determine the script path

The scripts live alongside this file. Resolve the directory:

```bash
SKILL_DIR="$(dirname "$(realpath "$0")")"
# or, if $0 isn't reliable, use the known path:
SKILL_DIR="$HOME/.claude/skills/computing-branch-diff"
```

### 2. Detect OS and run the appropriate script

```bash
# In bash (Linux, macOS, Git Bash on Windows):
bash "$SKILL_DIR/branch-diff.sh"

# In PowerShell (Windows native):
& "$SKILL_DIR/branch-diff.ps1"
```

**OS detection** — when in doubt, prefer the bash script. Use PowerShell only when the session shell is PowerShell:

```bash
if [ -n "$PSVersionTable" ] || [ "$TERM_PROGRAM" = "pwsh" ]; then
  pwsh "$SKILL_DIR/branch-diff.ps1"
else
  bash "$SKILL_DIR/branch-diff.sh"
fi
```

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

--- CHANGED_FILES ---
path/to/file1
path/to/file2

--- COMMITS ---
abc123 commit message

--- DIFF ---
[full diff, or LARGE_DIFF_FILE=/tmp/branch-diff-XXXXX.patch if > 1000 lines]
```

**Always report `BASE` and `MERGE_BASE`** so the calling agent can use them for further operations (e.g. `git show "$MERGE_BASE":path/to/file`).

When `STATUS=empty`, report: "No commits on this branch relative to `$BASE`. Diff is empty." Do not attempt further processing.

When `LARGE_DIFF_FILE=...` appears, report the path — do not inline the diff.
