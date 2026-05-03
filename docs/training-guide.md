# 🧪 Training Guide

The training system lets you iteratively improve skill and agent definitions by running automated evaluation cycles. It is invoked with the `/run-training` skill.

## Theory

The system implements the [autoresearch pattern](https://github.com/karpathy/autoresearch) described by Andrej Karpathy. The core idea: treat a definition file (skill or agent) as a tunable artefact. Each training cycle proposes a mutation to the definition, evaluates it against a set of committed test cases, and keeps the change only if it improves the score. Over many cycles this converges toward a definition that passes all evals.

## When to Use It

Run training after:
- Writing or editing a skill or agent definition
- Adding new eval cases that expose a gap in the current definition
- Noticing consistent failure modes in real use

If you edit a skill or agent file while Claude Code is active, the `suggest-training` PostToolUse hook (`.claude/hooks/suggest-training.py`) will automatically prompt you to run training for the definition you just changed. You can accept or decline.

## Invoking Training

```bash
/run-training <skill-name>           # train a skill
/run-training agent:<agent-name>     # train an agent
```

Examples:
```bash
/run-training triaging-gh-issue
/run-training agent:reviewer-docs
```

On the first run for a given skill or agent, training will auto-generate a set of starter eval cases from the definition content, show them to you, and ask for approval before writing any files. You can edit them before approving.

## How It Works

At a high level, training runs through these stages:

1. **Resolve** your input to the definition file and evals directory.
2. **Load or auto-generate** eval cases.
3. **Score the current definition** against evals to establish a baseline.
4. **Iterate**: each cycle mutates the definition, scores the candidate, and keeps the change only if it improves. Human gates pause the loop every 5 cycles, on perfect score, or after 3 consecutive non-improvements.
5. **Summarise** the run and show a diff of what changed.
6. **Optionally apply** the best candidate back to the live definition — always with your explicit approval.

The live definition file is never modified during the loop. For full implementation detail, see [`.claude/skills/run-training/SKILL.md`](../.claude/skills/run-training/SKILL.md).

## Eval Files

Eval files are plain markdown files committed under `training/skills/<name>/` or `training/agents/<name>/`. They are the ground truth the training loop optimises against.

### Format

```markdown
## Scenario
[Describe the situation being tested.]

## Expected Behavior
[What the skill/agent should do.]

## Pass Criteria
- [ ] Criterion 1 (binary, testable)
- [ ] Criterion 2
- [ ] Criterion 3
```

### Naming

Lowercase, hyphen-separated: `happy-path.md`, `missing-definition.md`. Must end with `.md`.

### Writing Good Evals

- Each criterion must be binary — pass or fail, no partial credit.
- Cover the common path, edge cases, and explicit failure modes.
- Evals with more criteria carry more weight in the overall score.
- When you notice a real failure in production use, add an eval that would have caught it.
- Auto-generated starter evals are a starting point — review and extend them.
