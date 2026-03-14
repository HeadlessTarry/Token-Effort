# 🪙 Token Effort

> Low-stakes intelligence for high-latency humans

A collection of AI agents and skills that do just enough to avoid being replaced by a shell script. Available for both GitHub Copilot and Claude Code — same agents, same skills, different platforms.

## 🚀 Getting Started

1. Clone the repo:

   ```bash
   git clone https://github.com/TheTarry/Token-Effort.git
   cd Token-Effort
   ```

2. Run the install script and pick your platform(s):

   ```bash
   ./install.sh
   ```

### GitHub Copilot

Shims install to `~/.copilot/agents/`. Agents are available via `@AI Customiser` in Copilot Chat. Skills load automatically when relevant.

### Claude Code

Shims install to `~/.claude/agents/`. Agents are available via `/agents` in Claude Code. Skills load automatically when relevant, or invoke directly with `/skill-name`.

## 🏗️ How it works

### Agents — Shim Pattern

Agent body content lives in `agents/custom_agents/` and is copied to `~/.agents/custom_agents/` — a shared, platform-agnostic home following the [agentskills.io](https://agentskills.io) convention. Each platform has a small shim file (in `claude/agents/` or `copilot/agents/`) containing only the platform-specific frontmatter and a pointer to the shared body:

```markdown
---
name: "My Agent"
model: claude-sonnet-4-6
tools: [read, edit]
---
Read and follow the agent instructions at: ~/.agents/custom_agents/my-agent/my-agent.md
```

**Updating agent instructions** — edit the body file in `~/.agents/custom_agents/` directly. Changes take effect immediately without reinstalling. Re-run `install.sh` to pull new versions from the repo.

### Skills — Cross-platform by default

Skills live in `agents/skills/` and are installed to both:
- `~/.agents/skills/` — cross-client interoperability path ([agentskills.io](https://agentskills.io) convention)

All skills are available to both platforms regardless of which platform you install for. Skills follow the [agentskills.io specification](https://agentskills.io/specification).

Note: to make these skills available to Claude Code, the `~/.claude/skills` directory will be replaced with a symlink to `~/.agents/skills`. Any pre-existing content under `~/.claude/skills` will be backed up prior to creating the symlink.

## 🤖 Agents

| Agent | What it does |
|---|---|
| **AI Customiser** | Expert agent for creating, reviewing, and editing AI customisation files. Works with both Claude Code and GitHub Copilot files. |
| **AI Customiser [Apply]** | Write-phase subagent invoked by AI Customiser to implement planned changes. Not intended for direct use. |

## 🧠 Skills

| Skill | What it does |
|---|---|
| **claude-customiser** | Domain knowledge for Claude Code customisations: decision framework, file schemas, Shim Pattern, subagent patterns, hooks, and reference URLs. |
| **claude-model-selection** | Model catalogue and selection guidance for Claude Code agents. |
| **copilot-customiser** | Domain knowledge for GitHub Copilot customisations: decision framework, file schemas, Shim Pattern, handoffs vs subagents, hooks, and reference URLs. |
| **copilot-model-selection** | Model catalogue and selection guidance for GitHub Copilot custom agents. |

## 🏗️ Adding New Agents

To add a new agent, create three files following the Shim Pattern:

**`agents/custom_agents/my-agent/my-agent.md`** — platform-agnostic body (no frontmatter):
```markdown
You are an expert in...
Write platform-agnostic instructions here.
```

**`claude/agents/my-agent.md`** — Claude shim:
```markdown
---
name: "My Agent"
model: claude-sonnet-4-6
tools: [read, edit]
---
Read and follow the agent instructions at: ~/.agents/custom_agents/my-agent/my-agent.md
```

**`copilot/agents/my-agent.agent.md`** — Copilot shim (note `.agent.md` extension):
```markdown
---
name: "My Agent"
model: "Claude Sonnet 4.6 (copilot)"
tools: ["read", "edit"]
---
Read and follow the agent instructions at: ~/.agents/custom_agents/my-agent/my-agent.md
```

## 🧠 Adding New Skills

Skills follow the [agentskills.io specification](https://agentskills.io/specification). Create a directory under `agents/skills/` with a `SKILL.md` file:

**`agents/skills/my-skill/SKILL.md`**:
```markdown
---
name: my-skill
description: >
  What this skill does and when to use it. Be specific.
---

# My Skill

Instructions go here.
```

The `name` field must match the directory name exactly (lowercase, hyphens only).

## 💻 Windows Note

The install script requires Bash. Run it from WSL or Git Bash.
Files install to `~/.copilot/`, `~/.claude/`, and `~/.agents/` (e.g. `C:\Users\<you>\.claude\` on Windows).
