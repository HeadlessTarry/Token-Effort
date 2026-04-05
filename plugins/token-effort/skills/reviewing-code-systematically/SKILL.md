---
name: reviewing-code-systematically
description: Use when a full code review is requested, on either a feature branch or the default branch.
user-invocable: true
---

# Systematic Code Review

## Overview

Dispatches multiple specialist reviewer agents in parallel against the current branch and collates their verdicts into a single unified result. Each reviewer is independent, so all run concurrently — the review takes as long as the slowest agent, not the sum of them all.

## Prerequisites

This skill requires `superpowers:dispatching-parallel-agents`, an external skill from the `superpowers` marketplace namespace. Install it from the Claude Code marketplace before using this skill. Without it, the parallel dispatch step will fail.

## When to Use

**Use when:**
- A full review has been explicitly requested (e.g. before merging, after completing a feature)
- You are on a feature branch with committed changes, or on the default branch

**Do not use when:**
- The branch has no commits relative to its base (the process detects this, but you can skip invocation entirely if you already know)
- Implementation is still in progress — wait until work is complete
- The request is to review a specific file, function, or diff snippet in isolation

## Reviewers

| Agent | Focus |
|-------|-------|
| `reviewer-dead-code` | Unreachable code, unused symbols, orphaned files, stale flags, commented-out blocks |
| `reviewer-docs` | README and docs/* accuracy, completeness, cross-reference validity |
| `reviewer-newcomer` | Naming clarity, missing comments, implicit assumptions, error message quality |

## Process

**REQUIRED SUB-SKILL:** Use `superpowers:dispatching-parallel-agents` for the dispatch step.

### 1. Detect review mode

Run the following to determine which mode to use:

1. Run `git rev-parse --abbrev-ref HEAD` → `$CURRENT_BRANCH`
2. Run `git symbolic-ref refs/remotes/origin/HEAD --short 2>/dev/null` to get the default branch (e.g. `origin/main` → strip `origin/` prefix → `main`). If that fails, try `git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}'`. If still empty, treat as feature branch.
3. If `$CURRENT_BRANCH == $DEFAULT_BRANCH` → **full-repo mode**. Otherwise → **branch mode**.

**Branch mode:**

**REQUIRED SUB-SKILL:** Use `computing-branch-diff` — capture full structured output verbatim.

If `STATUS=empty`, stop immediately — report "No commits on this branch relative to `$BASE`. Nothing to review." Do not dispatch any reviewers.

Build review scope by prepending `MODE=branch` as the first line of the `computing-branch-diff` output:

```
MODE=branch
BASE=...
MERGE_BASE=...
STATUS=ok
...rest of computing-branch-diff output...
```

**Full-repo mode:**

Run `git ls-files` to get all tracked files. Build review scope:

```
MODE=full-repo
STATUS=ok

--- ALL_FILES ---
<output of git ls-files, one file per line>
```

### 2. Dispatch all reviewers in parallel

Read the full list of reviewers (above).

Launch each as a separate Task using this prompt (replace `<CWD>` with the actual working directory path and `<REVIEW_SCOPE_OUTPUT>` with the full captured review scope from step 1):

```
Run your full review process on the working directory: <CWD>.

The review scope has been pre-computed. Use the data below to determine what to review:

<review-scope>
<REVIEW_SCOPE_OUTPUT>
</review-scope>

If MODE=branch, review only the changed files listed in CHANGED_FILES.
If MODE=full-repo, review ALL files listed in ALL_FILES.

Return your complete structured output exactly as defined in your Output Format, starting with the VERDICT line.
```

Use `subagent_type` to select the correct reviewer for each task.

### 3. Collect all verdicts

Wait for all agents to return. Each response starts with a `VERDICT:` line followed by their structured findings.

### 4. Compute the unified verdict

Apply the precedence rule: `BLOCK` > `NEEDS_CHANGES` > `PASS` > `SKIP`.

| Unified verdict | Condition |
|-----------------|-----------|
| `BLOCK` | Any reviewer returned `BLOCK` |
| `NEEDS_CHANGES` | No BLOCK; at least one reviewer returned `NEEDS_CHANGES` |
| `PASS` | All reviewers returned `PASS` or `SKIP` |
| `SKIP` | All reviewers returned `SKIP` |

### 5. Produce the unified report

Extract all severity-labelled findings (`[Severity: HIGH]`, `[Severity: MEDIUM]`, `[Severity: LOW]`) from every reviewer's output. Group them by severity in descending order. Prefix each finding heading with the source reviewer name in brackets.

Non-finding sections (Positive Elements, Summary Table, Cross-Reference Results, Documentation Gaps) are preserved as-is under each reviewer's heading in the "Additional Reviewer Output" section.

```
UNIFIED VERDICT: BLOCK | NEEDS_CHANGES | PASS | SKIP

## Reviewer Verdicts

| Reviewer | Verdict |
|----------|---------|
| <reviewer name> | <VERDICT> |
| <reviewer name> | <VERDICT> |
| <reviewer name> | <VERDICT> |

---

## HIGH Findings

### [<reviewer name>] <Short title>
<full finding block>

(repeat for each HIGH finding across all reviewers; omit section if no HIGH findings)

---

## MEDIUM Findings

(all MEDIUM findings from all reviewers, each prefixed with [<reviewer name>]; omit section if none)

---

## LOW Findings

(all LOW findings from all reviewers, each prefixed with [<reviewer name>]; omit section if none)

---

## Additional Reviewer Output

### <reviewer name>

<non-finding sections: Positive Elements, Summary Table, etc.>

### <reviewer name>

<non-finding sections: Cross-Reference Results, Positive Elements, etc.>

### <reviewer name>

<non-finding sections: Documentation Gaps, Positive Elements, etc.>

```

If a reviewer returns PASS or SKIP with no findings, paste their full output under their heading in Additional Reviewer Output.

## Common Mistakes

- **Running reviewers sequentially** — all reviewers must be dispatched together in a single parallel batch. Do not wait for one to finish before starting the next.
- **Overriding reviewer verdicts** — do not second-guess a reviewer's individual verdict. Apply the precedence rule mechanically.
- **Omitting findings from the severity sections** — every severity-labelled finding from every reviewer must appear in the grouped severity sections. Do not drop findings.
- **Forgetting to substitute `<CWD>` or `<REVIEW_SCOPE_OUTPUT>`** — each task prompt must contain the actual working directory and the pre-computed review scope, not the placeholders.
- **Running computing-branch-diff on the default branch** — only use it in branch mode. In full-repo mode, use `git ls-files` instead.
- **Running on the default branch without checking first** — always detect whether you are on a feature branch or the default branch before choosing a review path.

## Eval

- [ ] Branch detection was performed before dispatching any reviewer
- [ ] When on the default branch, `git ls-files` was used to gather the file list
- [ ] When on a feature branch, `computing-branch-diff` was called exactly once; if `STATUS=empty`, execution stopped immediately with the specified message
- [ ] Review scope block passed to each agent contains the correct `MODE=` header
- [ ] All reviewer agents were dispatched in a single parallel batch (not sequentially)
- [ ] Each task prompt contained the actual working directory and the pre-computed review scope (no placeholders left in)
- [ ] All agents returned a response with a `VERDICT:` line
- [ ] Unified verdict correctly reflects the highest-severity individual verdict
- [ ] Unified report groups findings by severity: HIGH first, then MEDIUM, then LOW
- [ ] Each finding is prefixed with the source reviewer name in brackets
- [ ] Non-finding sections appear in "Additional Reviewer Output", not in the severity sections
- [ ] `BLOCK` unified verdict is used when at least one reviewer returned `BLOCK`
