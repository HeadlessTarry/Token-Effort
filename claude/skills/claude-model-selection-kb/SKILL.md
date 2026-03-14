---
name: claude-model-selection-kb
description: >
  Knowledge base for selecting the right Claude model in Claude Code customisations.
  Covers when to pin a model vs omit it, task-based model selection framework,
  current Anthropic model catalogue with API identifiers. Load when deciding which
  model to specify in the `model:` field of a Claude Code agent or skill, or when
  advising on model choice for any task.
user-invocable: false
---

# Claude Code Model Selection — Domain Knowledge

## When to pin `model:` vs omit it

| Situation | Recommendation |
|---|---|
| Agent needs consistent quality for complex multi-step tasks (e.g. orchestrators, planning agents) | Pin a specific model |
| Agent tasks are variable or unpredictable in complexity | Omit `model:` — Claude Code uses the active model |
| Agent is a subagent doing tightly scoped work | Pin a fast/cheap model appropriate to that scope |
| You are advising a user and their task is unknown | Default to omitting `model:` — they can pin later |

## Task-Based Model Selection

Claude Code uses Anthropic models only. Use this framework to match an agent's primary task to the best model.

### Fast help and tightly scoped subagents
> Apply subagents doing deterministic writes, simple Q&A, lightweight prototyping.

- **`claude-haiku-4-5-20251001`** — Fastest Anthropic model. Best for scoped, repetitive, or low-stakes tasks where speed matters more than depth.

### General-purpose agentic work (recommended default)
> Orchestrators, planning agents, general coding, code review, explanations, multi-step workflows.

- **`claude-sonnet-4-6`** — Best balance of quality and cost for agentic workflows. Strong reasoning, reliable tool use. Recommended default for most agents.

### Deep reasoning and hardest tasks
> Complex architecture decisions, long multi-file debugging, tasks where quality is critical and cost is acceptable.

- **`claude-opus-4-6`** — Anthropic's most capable model. Reserve for tasks where `claude-sonnet-4-6` falls short.

## Current Model Catalogue (March 2026)

| Model | API identifier | Best for |
|---|---|---|
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | Fast subagents, simple tasks, lightweight prototyping |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | Orchestrators, general agentic work — recommended default |
| Claude Opus 4.6 | `claude-opus-4-6` | Complex reasoning, hardest tasks, long multi-step work |

> Model availability and identifiers change. Verify current identifiers at the reference URL below before pinning a model in production.

## Model Identifier Format

The `model:` field accepts three forms:

**Full API identifier** — pins an exact model version:
```yaml
model: claude-sonnet-4-6
model: claude-haiku-4-5-20251001
model: claude-opus-4-6
```

**Shorthand alias** — always resolves to the latest model in that family:
```yaml
model: sonnet   # latest Sonnet
model: haiku    # latest Haiku
model: opus     # latest Opus
```

**`inherit`** — explicitly uses the active model selected in Claude Code (same as omitting `model:` entirely):
```yaml
model: inherit
```

Use full identifiers when you need version stability. Use shorthands when you want automatic upgrades as new models release. Typos in full identifiers will cause Claude Code to reject the configuration — if unsure, verify against the reference URL below.

## Reference URLs

Fetch these only when you need current detail beyond what is in this skill.

| Need detail on… | URL |
|---|---|
| Current model identifiers and capabilities | https://docs.anthropic.com/en/docs/about-claude/models/overview |
| Model pricing and context windows | https://docs.anthropic.com/en/api/pricing |
