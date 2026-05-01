---
name: run-training
description: Use when the user wants to iteratively improve a skill or agent definition through automated evaluation cycles against committed test cases.
user-invocable: true
---

# Training: Iterative Skill/Agent Improvement

## Overview

Applies the [Karpathy "autoresearch" pattern](https://github.com/karpathy/autoresearch) to skill and agent definitions. Instead of tweaking ML training code, it mutates `SKILL.md` / agent `.md` files and scores each candidate against committed eval cases. Run for a single cycle (manual) or many cycles (autonomous).

**Usage:** `/run-training plugins/<plugin>/skills/<name>/SKILL.md` or `/run-training plugins/<plugin>/agents/<name>.md`

> **Note:** The old shorthand forms (`/run-training <name>` and `/run-training agent:<name>`) are no longer supported. Always supply the full plugin-relative path.

## Phase 1 — Target

Resolve paths from the user's argument by parsing the plugin, type, and name from the supplied path:

| Input | Plugin | Type | Name | Definition file | Evals directory |
|-------|--------|------|------|----------------|-----------------|
| `plugins/workflow/skills/brainstorming-gh-issue/SKILL.md` | `workflow` | `skills` | `brainstorming-gh-issue` | `plugins/workflow/skills/brainstorming-gh-issue/SKILL.md` | `training/workflow/skills/brainstorming-gh-issue/` |
| `plugins/labs/agents/skill-creator-engineer.md` | `labs` | `agents` | `skill-creator-engineer` | `plugins/labs/agents/skill-creator-engineer.md` | `training/labs/agents/skill-creator-engineer/` |

Parse rules:
- **Definition file**: the argument as supplied verbatim
- **Plugin**: second path segment (e.g. `plugins/<plugin>/...`)
- **Type**: third path segment — `skills` or `agents`
- **Name**: for skills, the fourth segment; for agents, the filename without `.md`
- **Evals directory**: `training/<plugin>/<type>/<name>/`

If the definition file is missing, **stop and report the error**. Do not proceed.

## Phase 2 — Eval Setup

- **No `.md` eval files exist** in `training/<plugin>/<type>/<name>/` (excluding `.training-results/`): auto-generate 3–5 starter eval cases from the definition. Display them to the user. **Wait for approval/edits before continuing.**
- **Evals already exist**: load all `.md` files from `training/<plugin>/<type>/<name>/` (excluding `.training-results/`). Report count to user.

### Eval filename conventions

When writing auto-generated eval files, names must:
- Use lowercase hyphenated words (e.g., `missing-definition.md`, `score-no-improvement.md`)
- Not start with a number
- End with `.md`

### Eval file format

Plain markdown, no frontmatter:

```markdown
## Scenario
[Input context]

## Expected Behavior
[What the skill/agent should do]

## Pass Criteria
- [ ] Criterion 1 (binary yes/no)
- [ ] Criterion 2
```

## Phase 3 — Baseline

1. **Clean up any previous run.** If `training/<plugin>/<type>/<name>/.training-results/` already exists, delete the entire directory and inform the user: "Removed stale `.training-results/` directory from a previous run." This prevents old state, candidates, or results from polluting the new session.
2. Read the current definition file.
3. For each eval file, simulate the scenario against the current definition: mark each pass criterion ✓ (pass) or ✗ (fail).
4. Score = criteria passed / total criteria across all evals.
5. Write initial state to `training/<plugin>/<type>/<name>/.training-results/state.json`:
   ```json
   {
     "iteration": 0,
     "baseline_score": <score>,
     "best_score": <score>,
     "cycles_without_improvement": 0
   }
   ```
6. Copy current definition to `training/<plugin>/<type>/<name>/.training-results/best.md`.
7. Report baseline score to user.
8. **If baseline score is 1.0**, trigger the human gate immediately before entering the loop. Show the gate summary and ask: **continue**, **stop**, or **adjust**.

## Phase 4 — Training Loop

**Each cycle:**

1. Load state from `training/<plugin>/<type>/<name>/.training-results/state.json`. **Never trust memory — always read from disk.**
2. Load all eval files from `training/<plugin>/<type>/<name>/` (excluding `.training-results/`).
3. Read `training/<plugin>/<type>/<name>/.training-results/best.md` as the starting point.
4. Apply one mutation operator to produce a candidate definition (hold in memory — do not write to the live file). **Before applying the mutation, state which operator you are choosing and explain why it addresses the observed failure pattern.**

   | Operator | When to use |
   |----------|-------------|
   | `add-constraint` | A rule that prevents an observed failure |
   | `add-example` | A concrete correct-behavior example |
   | `tighten-language` | Replace ambiguous wording with precise instructions |
   | `restructure` | Reorder steps/sections for clearer execution |
   | `add-negative-example` | Explicit "do NOT do X" case |
   | `remove-bloat` | Trim contradictory or redundant instructions |

   Select the operator based on failure patterns from the previous cycle. On cycle 1, analyse baseline eval results to choose. **Do not reuse the same operator as the previous cycle if that cycle was not kept — a repeated operator against the same failure pattern is unlikely to score higher.**

5. Evaluate the candidate: for each eval, mark each pass criterion ✓/✗.
6. Score the candidate: criteria passed / total criteria.
7. Compare candidate score against `best_score` from `state.json`:
   - **Score improved**: overwrite `best.md` with candidate, update `best_score`, reset `cycles_without_improvement` to 0. Mark as **kept**.
   - **Score did not improve**: discard candidate, increment `cycles_without_improvement`. Mark as **reverted**.
   - **The live definition file is NEVER modified during the loop.**
8. Append to `training/<plugin>/<type>/<name>/.training-results/results.jsonl`:
   ```
   {"iteration": N, "score": X.XX, "best_score": X.XX, "operator": "add-constraint", "kept": true/false, "failed_criteria": ["criterion text", ...]}
   ```
9. Increment `iteration` in `state.json`.
10. **Human gate** — pause if any condition is met:
    - Score has reached 1.0 - i.e. no further improvement to be made against current set of evals
    - Every 5 cycles completed
    - 3 consecutive cycles with no improvement (`cycles_without_improvement >= 3`)

    Show summary table:
    ```
    | Cycle | Score | Operator       | Kept? |
    |-------|-------|----------------|-------|
    | 1     | 0.72  | add-constraint | ✓     |
    ```
    Ask: **continue** (run N more cycles), **stop**, or **adjust** (user edits evals or gives guidance). When the user specifies N cycles to continue: run exactly N cycles, then pause at the human gate again — regardless of the 5-cycle boundary.

## Phase 5 — Completion

Report: baseline score → best score, total cycles run, mutations kept vs reverted. Show a diff of `best.md` against the original live definition (which was never modified).

## Phase 6 — Apply (optional)

Ask: "Overwrite `<definition file path>` with the best candidate from this run?"

- **Yes**: write `best.md` → the live definition file. **Write to exactly the path Phase 1 resolved — do not re-resolve, expand, or infer the path from the skill name or a known install location (e.g., `~/.claude/`). The destination is fixed at Phase 1.**
- **No**: leave the original intact. Inform the user that the best candidate was not applied, and provide both the live definition path and `training/<plugin>/<type>/<name>/.training-results/best.md` so they can apply it manually.

**Never auto-apply without explicit user approval.**

## State Files

All files are gitignored via `training/.gitignore`:

```
training/<plugin>/<type>/<name>/.training-results/
├── state.json      ← iteration, best score, cycles-without-improvement
├── best.md         ← best-scoring candidate seen so far
└── results.jsonl   ← one entry per cycle
```

## Common Mistakes

- **Not cleaning up a stale `.training-results/` directory** — always delete it at the start of Phase 3 so old state, candidates, and results cannot carry over into the new session.
- **Modifying the live definition during the loop** — the loop only ever writes to `.training-results/best.md`.
- **Trusting in-memory state** — always read `state.json` from disk at the start of each cycle.
- **Evaluating the live definition during the loop** — always evaluate candidates against `best.md`.
- **Auto-applying the best candidate** — Phase 6 requires explicit user approval.
- **Skipping the human gate** — pause at every 5 cycles and at 3 consecutive cycles without improvement.
- **Re-resolving the apply path in Phase 6** — always write to exactly the path Phase 1 resolved. Never re-resolve, expand, or infer the destination from the skill name or a known install location like `~/.claude/`. The live definition path is determined once in Phase 1 and used verbatim in Phase 6.

## Eval

- [ ] Deleted stale `.training-results/` directory (if present) before writing any new state in Phase 3
- [ ] Resolved definition path and evals directory correctly for both skill and agent inputs
- [ ] Stopped and reported error when definition file was missing
- [ ] Auto-generated starter evals and waited for user approval when no evals existed
- [ ] Wrote `state.json` with correct initial values before starting the loop
- [ ] Copied the current definition to `best.md` before the first cycle
- [ ] Read `state.json` from disk at the start of each cycle (not from memory)
- [ ] Evaluated candidates against `best.md`, not the live definition file
- [ ] Never wrote to the live definition file during the loop
- [ ] Appended a JSONL entry to `results.jsonl` after each cycle
- [ ] Paused at the human gate every 5 cycles or when `cycles_without_improvement >= 3`
- [ ] Asked for explicit user approval before overwriting the live definition in Phase 6
