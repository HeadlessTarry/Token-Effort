---
name: copilot-model-selection-kb
description: >
  Knowledge base for selecting the right AI model in GitHub Copilot customisations.
  Covers when to pin a model vs use Auto, task-based model selection framework,
  current model catalogue with identifiers and multipliers, plan availability,
  and model identifier format. Load when deciding which model to specify in the
  `model:` field of a custom agent, or when advising on model choice for any task.
user-invocable: false
---

# GitHub Copilot Model Selection — Domain Knowledge

## When to pin `model:` vs use Auto

| Situation | Recommendation |
|---|---|
| Agent needs consistent quality for complex multi-step tasks (e.g. orchestrators, planning agents) | Pin a specific model |
| Agent tasks are variable or unpredictable in complexity | Use Auto (omit `model:` field) |
| Agent is a subagent doing tightly scoped work | Pin a fast/cheap model appropriate to that scope |
| You are advising a user and their plan is unknown | Default to omitting `model:` — they can pin later |

Auto model selection (VS Code 1.104+) automatically picks from Claude Sonnet 4, GPT-5, GPT-5 mini and others. It applies a request discount for paid users. For agents where quality consistency is critical, pinning is preferred.

## Task-Based Model Selection

Use this framework to match an agent's primary task to the best model family.

### General-purpose coding and writing
> Write/review functions, generate docs, explain errors, short code edits.

- **GPT-5 mini** — Fast, accurate, 0× multiplier. Good default.
- **GPT-5.3-Codex** — Higher-quality for complex engineering tasks (features, tests, debugging, refactors, reviews). 1× multiplier.
- **Grok Code Fast 1** — Specialised for code generation and debugging. 0.25× multiplier.

### Fast help with simple or repetitive tasks
> Small functions, syntax questions, lightweight prototyping, quick feedback.

- **Claude Haiku 4.5** — Fast, reliable, 0.33× multiplier.
- **Gemini 3 Flash** — Fast, 0.33× multiplier.

### Deep reasoning, debugging, and architecture
> Complex refactoring, multi-file debugging, architectural decisions, multi-step agent workflows.

- **Claude Sonnet 4.6** — Best balance of quality and cost for agentic workflows. 1× multiplier. Recommended for orchestrators.
- **Claude Opus 4.6** — Anthropic's most powerful model. 3× multiplier. Reserve for the hardest tasks.
- **GPT-5.4** — Complex reasoning and technical decision-making. 1× multiplier.
- **Gemini 3 Pro** — Deep reasoning across long contexts. 1× multiplier.

### Agentic software development (autonomous coding tasks)
> Agentic tasks with tool use, edit-then-test loops, end-to-end feature implementation.

- **GPT-5.1-Codex-Max** — Agentic tasks, high tool precision. 1× multiplier.
- **GPT-5.2-Codex** — Agentic tasks. 1× multiplier.
- **GPT-5.3-Codex** — Delivers higher-quality code on complex engineering tasks. 1× multiplier.
- **Gemini 3.1 Pro** — Effective edit-then-test loops with high tool precision. 1× multiplier. (preview)

### Working with visuals (screenshots, diagrams, UI)
- **GPT-5 mini** — Multimodal, fast, 0× multiplier.
- **Claude Sonnet 4.6** — Multimodal, strong reasoning. 1× multiplier.
- **Gemini 3 Pro** — Deep reasoning + visual input. 1× multiplier.

## Current Model Catalogue (March 2026)

| Model | Provider | Status | Multiplier | Plans |
|---|---|---|---|---|
| GPT-4.1 | OpenAI | GA | 0× | All |
| GPT-5 mini | OpenAI | GA | 0× | All |
| GPT-5.1 | OpenAI | GA | 1× | Pro+ |
| GPT-5.1-Codex | OpenAI | GA | 1× | Pro+ |
| GPT-5.1-Codex-Mini | OpenAI | Preview | 0.33× | Pro+ |
| GPT-5.1-Codex-Max | OpenAI | GA | 1× | Pro+ |
| GPT-5.2 | OpenAI | GA | 1× | Pro+ |
| GPT-5.2-Codex | OpenAI | GA | 1× | Pro+ |
| GPT-5.3-Codex | OpenAI | GA | 1× | Pro+ |
| GPT-5.4 | OpenAI | GA | 1× | Enterprise/Business+ |
| Claude Haiku 4.5 | Anthropic | GA | 0.33× | All |
| Claude Sonnet 4 | Anthropic | GA | 1× | Pro+ |
| Claude Sonnet 4.5 | Anthropic | GA | 1× | Pro+ |
| Claude Sonnet 4.6 | Anthropic | GA | 1× | Pro+ |
| Claude Opus 4.5 | Anthropic | GA | 3× | Pro+ |
| Claude Opus 4.6 | Anthropic | GA | 3× | Pro+ |
| Claude Opus 4.6 (fast mode) | Anthropic | Preview | 30× | Enterprise only |
| Gemini 2.5 Pro | Google | GA | 1× | Pro+ |
| Gemini 3 Flash | Google | Preview | 0.33× | Pro+ |
| Gemini 3 Pro | Google | Preview | 1× | Pro+ |
| Gemini 3.1 Pro | Google | Preview | 1× | Pro+ |
| Grok Code Fast 1 | xAI | GA | 0.25× | All |
| Raptor mini | Fine-tuned GPT-5 mini | Preview | 0× | All |

> Model availability varies by Copilot plan (Free, Pro, Pro+, Business, Enterprise). Models marked "Pro+" require at minimum a Copilot Pro subscription. Verify current availability at the reference URLs below — the catalogue changes frequently.

## Model Identifier Format

When specifying a model in YAML frontmatter, use the display name in title case followed by `(copilot)` as the vendor qualifier. Examples:

```yaml
model: "Claude Sonnet 4.6 (copilot)"
model: "GPT-5 mini (copilot)"
model: "Gemini 3 Pro (copilot)"
```

> The format is `Model Name (vendor)` — always title case with `(copilot)` as the vendor for GitHub Copilot built-in models. VS Code uses this to match the entry in the Language Models editor. Incorrect values silently fall back to the default model. If you are unsure of the exact name, open the Language Models editor (`Chat: Manage Language Models`) to see the exact display name for each model.

## Reference URLs

Fetch these only when you need current detail beyond what is in this skill.

| Need detail on… | URL |
|---|---|
| Full model catalogue with per-client and per-plan availability | https://docs.github.com/en/copilot/reference/ai-models/supported-models |
| Task-based model selection guide | https://docs.github.com/en/copilot/reference/ai-models/model-comparison |
| Premium request multipliers | https://docs.github.com/en/copilot/managing-copilot/monitoring-usage-and-entitlements/about-premium-requests |
| Auto model selection concept | https://docs.github.com/en/copilot/concepts/auto-model-selection |
| Changing the model in VS Code | https://code.visualstudio.com/docs/copilot/customization/language-models |
