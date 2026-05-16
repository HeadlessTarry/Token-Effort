# Migration: reviewing-code-systematically

## Overview

Migrate the `reviewing-code-systematically` skill from `pending-migration/` (legacy Claude Code format) to `skills/` (OpenCode format), and move `reviewer-docs.md` from `.opencode/agents/` to `agents/`.

## Key Changes

1. **Remove external skill dependency** — Replace `superpowers:dispatching-parallel-agents` with OpenCode's native `task` tool
2. **Native parallel dispatch** — Use `task` with `subagent_type` parameter for reviewer dispatch
3. **OpenCode conventions** — No `${VAR}` shell expansion, use `printenv VAR`
4. **Agent consolidation** — All 3 reviewer agents in `agents/` directory with consistent format

## Architecture

### Skill Location
- **Source:** `pending-migration/plugins/workflow/skills/reviewing-code-systematically/SKILL.md`
- **Target:** `skills/reviewing-code-systematically/SKILL.md`

### Agent Locations
- `agents/reviewer-dead-code.md` (already correct)
- `agents/reviewer-newcomer.md` (already correct)
- `agents/reviewer-docs.md` (move from `.opencode/agents/`)

### Process Flow

```
Phase 1: Detect review mode (branch vs full-repo)
Phase 2: Compute review scope (computing-branch-diff or git ls-files)
Phase 3: Dispatch 3 reviewers in parallel via native task tool
Phase 4: Collect verdicts from all reviewers
Phase 5: Compute unified verdict (BLOCK > NEEDS_CHANGES > PASS > SKIP)
Phase 6: Produce unified report (severity-grouped findings)
```

## Dispatch Mechanism

### Original (Claude Code)
```
superpowers:dispatching-parallel-agents → Task prompts with subagent_type
```

### New (OpenCode)
```
task(description="Dead code review", prompt="<scope>", subagent_type="reviewer-dead-code")
task(description="Docs review", prompt="<scope>", subagent_type="reviewer-docs")
task(description="Newcomer review", prompt="<scope>", subagent_type="reviewer-newcomer")
```

All 3 dispatched in a single parallel batch.

## Review Scope Format

### Branch Mode
```
MODE=branch
BASE=<base-branch>
MERGE_BASE=<commit-hash>
STATUS=ok
CHANGED_FILES=<file-list>
COMMITS=<commit-list>
DIFF=<diff-content-or-LARGE_DIFF_FILE-path>
```

### Full-Repo Mode
```
MODE=full-repo
STATUS=ok

--- ALL_FILES ---
<git ls-files output>
```

## Unified Report Format

```
UNIFIED VERDICT: BLOCK | NEEDS_CHANGES | PASS | SKIP

## Reviewer Verdicts
| Reviewer | Verdict |
|----------|---------|
| reviewer-dead-code | <VERDICT> |
| reviewer-docs | <VERDICT> |
| reviewer-newcomer | <VERDICT> |

---

## HIGH Findings
### [<reviewer-name>] <finding-title>
<finding-content>

## MEDIUM Findings
### [<reviewer-name>] <finding-title>
<finding-content>

## LOW Findings
### [<reviewer-name>] <finding-title>
<finding-content>

---

## Additional Reviewer Output
### <reviewer-name>
<positive-elements, summary-table, etc.>
```

## Training Evals

Migrate existing evals from `pending-migration/training/workflow/skills/reviewing-code-systematically/` to `training/workflow/skills/reviewing-code-systematically/`:

1. Unified verdict computation
2. Full-repo mode behavior
3. Severity grouping
4. Empty status handling
5. Branch-mode parallel dispatch

## Dependencies

- `computing-branch-diff` skill (branch mode scope computation)
- `reviewer-dead-code` agent (parallel dispatch target)
- `reviewer-docs` agent (parallel dispatch target)
- `reviewer-newcomer` agent (parallel dispatch target)

## Success Criteria

- Skill installed via `install.sh --skill reviewing-code-systematically`
- All 3 agents installed via `install.sh --agent <name>`
- Parallel dispatch works without external skill dependency
- Unified report format matches original specification
- Training evals pass after migration
