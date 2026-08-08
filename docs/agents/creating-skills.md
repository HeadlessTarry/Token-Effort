# Creating Skills

How to build, test, and ship a new skill — and how to break down the work.

## What is a skill?

A skill is three things shipped together:

| Artefact | Path | Purpose |
|----------|------|---------|
| Definition | `skills/<name>/SKILL.md` | The instructions the agent follows |
| Eval suite | `training/skills/<name>/*.md` | Scenarios that verify the definition works |
| Training run | `.training-results/` (generated) | Proof the definition passes all evals |

None of these is useful without the others. A definition without evals is untested. Evals without a training run are unverified.

## The golden rule

**Creating a skill is one ticket.**

A ticket to "create skill X" delivers:

1. A `SKILL.md` following the repo's skill structure
2. An eval suite covering happy paths, edge cases, and failure modes
3. A training run that reaches **100% pass rate**

Do **not** split this into separate tickets for "write the definition", "write the evals", and "run training". The skill is not verifiable without evals, and the work is not complete until evals are green.

## Lifecycle

```
Draft ──► Eval ──► Train ──► Ship
```

### 1. Draft

Write the `SKILL.md`. Use `/agent-skill-crafter` or model it on an existing skill (`skills/report-bug/SKILL.md`, `skills/propose-feature/SKILL.md`).

Minimum sections: Overview, When to Use, Prerequisites, Process, Common Mistakes, Eval.

### 2. Eval

Write eval scenarios in `training/skills/<name>/`. Each file is one scenario:

```markdown
## Scenario
[The situation being tested]

## Expected Behavior
[What the skill should do]

## Pass Criteria
- [ ] Binary criterion 1
- [ ] Binary criterion 2
```

Cover:
- **Happy path** — the skill works as intended in the normal case
- **Edge cases** — missing input, ambiguous triggers, template not found
- **Failure modes** — the specific mistakes listed in Common Mistakes

If you are unsure what to test, run `/run-training` once — it will auto-generate starter evals for you to review and extend.

### 3. Train

Run `/run-training skills/<name>/SKILL.md`. The loop mutates the definition, scores it against evals, and keeps improvements. Iterate until 100%.

Human gates pause the loop every 5 cycles, on perfect score, or after 3 consecutive non-improvements. Approve the final candidate to apply it.

### 4. Ship

Commit the `SKILL.md` and eval files together. The `.training-results/` directory is generated artefact — do not commit it.

## When to split into multiple tickets

Most skills fit in one ticket. Split only when the skill has **distinct, independently verifiable phases** — for example, a skill that discovers templates *and* conducts an interview *and* files an issue could be split by phase, but **each phase ticket still includes its own evals and training to 100%**.

The test: can you demonstrate that phase works in isolation, with evals, without the other phases? If yes, it can be a separate ticket. If no, keep it together.

## Breaking down work in general

When deciding how to break down any piece of work:

| Signal | Action |
|--------|--------|
| The deliverable is not verifiable on its own | Keep it with its verifier in one ticket |
| A sub-task has no meaningful "done" without the rest | Keep it together |
| Two pieces can be independently tested and merged | Split into separate tickets |
| A ticket will take more than one session | Split at the cheapest vertical slice boundary |

**Prefer vertical slices over horizontal layers.** A vertical slice delivers a thin but complete, testable unit end-to-end. A horizontal layer (e.g. "write all definitions", then "write all evals") delivers nothing testable until the last layer is done.

## Common mistakes

- **Splitting "write skill" and "write evals" into separate tickets.** The evals are part of the skill. Without them you cannot prove the skill works.
- **Treating "run training" as a separate step.** Training is the verification that the skill + evals are correct. It is the last part of the same ticket.
- **Stopping at 80% pass rate.** A skill that fails some evals has known bugs. Ship when green.
- **Writing evals after the fact.** Write evals alongside the definition — they help you discover gaps in the spec.
- **Horizontal breakdowns.** "Write all SKILL.md files" → "write all evals" → "run all training" looks efficient but delivers nothing testable until the end.
