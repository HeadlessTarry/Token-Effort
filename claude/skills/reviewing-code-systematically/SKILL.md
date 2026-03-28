---
name: reviewing-code-systematically
description: Use when a full code review of the current branch is requested.
user-invocable: true
---

# Systematic Code Review

## Overview

Dispatches multiple specialist reviewer agents in parallel against the current branch and collates their verdicts into a single unified result. Each reviewer is independent, so all run concurrently — the review takes as long as the slowest agent, not the sum of them all.

## Reviewers

| Agent | Focus |
|-------|-------|
| `reviewer-dead-code` | Unreachable code, unused symbols, orphaned files, stale flags, commented-out blocks |
| `reviewer-docs` | README and docs/* accuracy, completeness, cross-reference validity |
| `reviewer-newcomer` | Naming clarity, missing comments, implicit assumptions, error message quality |

## Process

**REQUIRED SUB-SKILL:** Use `superpowers:dispatching-parallel-agents` for the dispatch step.

### 1. Compute the branch diff

**REQUIRED SUB-SKILL:** Use `computing-branch-diff` to compute the branch diff. Capture the full structured output verbatim (BASE, MERGE_BASE, STATUS, MESSAGE if present, changed files, commits, and the diff or LARGE_DIFF_FILE path).

If `STATUS=empty`, stop immediately — report "No commits on this branch relative to `$BASE`. Nothing to review." Do not dispatch any reviewers.

### 2. Dispatch all reviewers in parallel

Read the full list of reviewers (above).

Launch each as a separate Task using this prompt (replace `<CWD>` with the actual working directory path and `<BRANCH_DIFF_OUTPUT>` with the full captured output from step 1):

```
Run your full review process on the working directory: <CWD>.

The branch diff has already been computed. Use the data below instead of running computing-branch-diff yourself:

<branch-diff>
<BRANCH_DIFF_OUTPUT>
</branch-diff>

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
- **Forgetting to substitute `<CWD>` or `<BRANCH_DIFF_OUTPUT>`** — each task prompt must contain the actual working directory and the captured diff output, not the placeholders.
- **Running computing-branch-diff more than once** — compute the diff once in step 1 and pass it to all subagents. Do not let subagents compute it independently.

## Eval

- [ ] `computing-branch-diff` was run exactly once, before any reviewer was dispatched
- [ ] When `computing-branch-diff` returns `STATUS=empty`, execution stopped immediately with the specified message and no reviewers were dispatched
- [ ] All reviewer agents were dispatched in a single parallel batch (not sequentially)
- [ ] Each task prompt contained the actual working directory and the pre-computed branch diff
- [ ] All agents returned a response with a `VERDICT:` line
- [ ] Unified verdict correctly reflects the highest-severity individual verdict
- [ ] Unified report groups findings by severity: HIGH first, then MEDIUM, then LOW
- [ ] Each finding is prefixed with the source reviewer name in brackets
- [ ] Non-finding sections appear in "Additional Reviewer Output", not in the severity sections
- [ ] `BLOCK` unified verdict is used when at least one reviewer returned `BLOCK`
