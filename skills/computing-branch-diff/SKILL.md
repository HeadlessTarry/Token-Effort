---
name: computing-branch-diff
description: Use when a subagent needs to know what changed on the current branch relative to its base — e.g. before a code review, changelog generation, or impact analysis.
user-invocable: false
---

# 🔀 Computing a Branch Diff

## Overview

Produces the merge-base, full diff, changed file list, and commit list for the current branch relative to its base. Delegates all logic to companion shell scripts — one Bash call, no approval chain. Handles base-branch detection, upstream fallback, `LARGE_DIFF_FILE` offloading, and `STATUS=empty` for branches with no unique commits.

## When to Use

**Use when:**
- You need to know what files changed on the current branch before a code review
- You need a changelog or commit list for the current branch
- You need to assess the impact scope of a branch's changes

**Do not use when:**
- **Detached HEAD** — `git rev-parse --abbrev-ref HEAD` returns `HEAD`; base branch detection will likely fail with exit 1
- **Shallow clone** — merge-base computation may be incorrect or error; run `git fetch --unshallow` first
- **No remotes configured** — base branch detection steps 2 and 3 require `origin`; if absent, exit 1 is expected

## Prerequisites

- Companion scripts `branch-diff.sh` and `branch-diff.ps1` must exist in the `scripts/` subdirectory relative to this skill file
- Git must be available in the session
- All operations use the Bash tool to run scripts directly (no subagent dispatch)

## Process

### Phase 1 — Resolve script directory

The companion scripts live in the `scripts/` subdirectory relative to this skill file. Resolve the directory:

```bash
SKILL_ROOT=$(git rev-parse --show-toplevel)
SCRIPT_DIR="$SKILL_ROOT/skills/computing-branch-diff/scripts"
```

Verify the directory exists. If not, stop with:

> "ERROR: skill scripts directory not found. Ensure `branch-diff.sh` and `branch-diff.ps1` exist in `skills/computing-branch-diff/scripts/`."

### Phase 2 — Detect OS and execute script

**On Linux, macOS, or Git Bash on Windows:**

```bash
bash "$SCRIPT_DIR/branch-diff.sh"
```

**On native Windows (PowerShell session):**

```bash
pwsh "$SCRIPT_DIR/branch-diff.ps1"
```

**OS detection** — default to `bash "$SCRIPT_DIR/branch-diff.sh"`. Only use `pwsh "$SCRIPT_DIR/branch-diff.ps1"` if the current session is explicitly a PowerShell session (i.e. the tool response indicates `pwsh` or `powershell` is the active shell).

### Phase 3 — Handle exit code

| Exit code | Meaning | Action |
|-----------|---------|--------|
| `0` | Success | Parse and report the output (see Phase 4) |
| `1` | Base branch not detected | Ask the user: "I could not detect the base branch. Please specify the branch to diff against (e.g. `origin/main`)." |
| `2` | Unexpected error | Report stderr to the user verbatim |

### Phase 4 — Parse and return structured output

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

## Common Mistakes

- **Running on the default branch itself** — `STATUS=empty` is expected; report "no unique commits" and stop; do not treat it as an error
- **Inlining the diff when `LARGE_DIFF_FILE` is set** — report the file path only; inlining can exceed context limits
- **Using shell expansion syntax** — never use `${VARIABLE}` or any `${...}` form. Use `printenv VARIABLE` instead
- **Dispatching a subagent** — this skill runs scripts directly via the Bash tool; do not use the Task or Agent tool to delegate

## Eval

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

**Scenario D — base branch not detected:** Script exits with code 1.
- [ ] User is prompted to specify the base branch manually
- [ ] No further processing occurs

**Scenario E — unexpected error:** Script exits with code 2.
- [ ] Stderr is reported to the user verbatim
- [ ] No further processing occurs

**General:**
- [ ] Script executed directly via Bash tool (no subagent dispatch)
- [ ] Script directory resolved as `scripts/` subdirectory relative to skill file
- [ ] No `${...}` shell expansion syntax used anywhere
