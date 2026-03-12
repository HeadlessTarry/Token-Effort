---
name: copilot-customisation-kb
description: >
  Domain knowledge for GitHub Copilot customisations: decision framework for
  choosing between agents, skills, prompt files, instruction files, and hooks;
  YAML frontmatter schemas for each format; subagent read/write separation patterns;
  tool-loading priority rules; and targeted reference URLs. Load when creating,
  editing, reviewing, or auditing any Copilot customisation file.
user-invocable: false
---

# GitHub Copilot Customisation — Domain Knowledge

## Decision Framework: Which format to use?

| Format | Use when… | File location |
|---|---|---|
| **Custom agent** (`.agent.md`) | You need a persistent persona across a conversation, tool restrictions, model preferences, handoffs, or subagent orchestration | `.github/agents/*.agent.md` |
| **Agent skill** (`SKILL.md`) | You need portable, reusable domain knowledge or a specialised workflow that Copilot should load automatically when relevant | `.github/skills/<name>/SKILL.md` |
| **Prompt file** (`.prompt.md`) | You need a lightweight, single-task slash command invoked manually | `.github/prompts/*.prompt.md` |
| **Instruction file** (`.instructions.md`) | You need coding standards or guidelines applied automatically by file glob | `.github/instructions/*.instructions.md` |
| **Hook** | You need automated actions triggered by agent lifecycle events (e.g. on file save, on tool call) | `.github/hooks/` |

**Default: prefer the simplest format.** If no tool restrictions or persistent persona are needed, a skill or prompt is almost always better than an agent.

## Key File Structures

### Custom Agent (`.agent.md`)

```yaml
---
name: "Agent Name"
description: "Shown in agents dropdown"
argument-hint: "Optional input hint"
tools: ["read", "search", "edit"]    # minimum necessary
agents: ["subagent-name"]            # omit if no subagents; [] blocks all
user-invocable: false                # set to hide from picker (subagent-only)
disable-model-invocation: true       # set to prevent subagent use by other agents
handoffs:
  - label: "Button label"
    agent: "target-agent"
    prompt: "Pre-filled prompt text"
    send: false                      # true = auto-submit
---
```

### Agent Skill (`SKILL.md`)

```yaml
---
name: skill-name          # must match parent directory name exactly (lowercase, hyphens)
description: >            # max 1024 chars — Copilot uses this for relevance matching
  What the skill does and when to use it. Be specific about both capabilities
  and use cases.
user-invocable: false     # hide from / menu; model still loads automatically
disable-model-invocation: true  # only allow explicit /slash invocation; model won't auto-load
---
```

The `name` field **must** match the parent directory name exactly or the skill will not load.

### Prompt File (`.prompt.md`)

```yaml
---
description: "Short description"
agent: agent              # ask | agent | plan | <custom-agent-name>
tools: ["read", "edit"]   # overrides the referenced agent's tool list if specified
---
```

### Instruction File (`.instructions.md`)

```yaml
---
applyTo: "src/**/*.ts"   # glob pattern — omit to apply to all files globally
---
```

## Subagent Pattern: Read/Write Separation Without Context Switching

To enforce a read/write boundary while keeping the user in a single conversation:

- **Orchestrator agent**: `tools: ["read", "search", "web/fetch", "agent"]`, `agents: ["apply-agent-name"]`
- **Apply subagent**: `tools: ["read", "edit"]`, `user-invocable: false`

The orchestrator researches, analyses, and plans; it then invokes the apply subagent inline to execute edits. The user never sees the subagent in the picker or needs to switch agents manually.

## Tool Loading Priority

When `tools` is declared in both a prompt file and a custom agent, the **prompt file takes precedence**.

## Constraints

- Always keep `tools` to the minimum necessary — no tool should be included unless the workflow requires it.
- Prefer decomposing large, multi-purpose agents into agent + skill + prompts.
- The skill `description` is the primary signal Copilot uses for relevance matching — make it specific about both what the skill does and when to use it.
- Never add tools, features, or abstractions beyond what the current task requires.

## Targeted Reference URLs

Fetch these only when you need detail on a specific feature. Do not fetch speculatively.

| Need detail on… | URL |
|---|---|
| Customisation concepts and capabilities overview | https://code.visualstudio.com/docs/copilot/concepts/customization |
| Always-on instructions | https://code.visualstudio.com/docs/copilot/customization/custom-instructions |
| Reusable prompt files | https://code.visualstudio.com/docs/copilot/customization/prompt-files |
| Custom agents | https://code.visualstudio.com/docs/copilot/customization/custom-agents |
| Subagent invocation and `agents:` field | https://code.visualstudio.com/docs/copilot/agents/subagents |
| Agent skills specification and portability | https://code.visualstudio.com/docs/copilot/customization/agent-skills |
| MCP servers | https://code.visualstudio.com/docs/copilot/customization/mcp-servers |
| Hooks syntax and lifecycle events | https://code.visualstudio.com/docs/copilot/customization/hooks |
