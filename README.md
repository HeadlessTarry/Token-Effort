# 🪙 Token Effort

> Low-stakes intelligence for high-latency humans

A collection of AI agents and skills that do just enough to avoid being replaced by a shell script. Available for both GitHub Copilot and Claude Code — same agents, same names, different platforms.

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

Files install to `~/.copilot/`. Agents are available via `@AI Customiser` in Copilot Chat. Skills load automatically when relevant.

### Claude Code

Files install to `~/.claude/`. Agents are available via `/agents` in Claude Code. Skills load automatically when relevant, or invoke directly with `/skill-name`.

## 🏗️ How it works

Install uses the **Shim Pattern**. Agent body content lives in `ai/agents/` and is copied to
`~/.ai/agents/` — a shared, platform-agnostic source of truth. Each platform has a small shim
file (in `claude/agents/` or `copilot/agents/`) containing only the platform-specific frontmatter
and a pointer to the shared body:

```markdown
---
name: "My Agent"
model: claude-sonnet-4-6
tools: [read, edit]
---
Read and follow the agent instructions at: ~/.ai/agents/my-agent.md
```

**Updating agent instructions** — edit the file in `~/.ai/agents/` directly. Changes take
effect immediately without reinstalling. Re-run `install.sh` to pull new versions from the repo.

## 🏗️ Adding New Agents

To add a new agent, create three files:

**`ai/agents/my-agent.md`** — platform-agnostic body (no frontmatter):
```markdown
You are an expert in AI customisations.
Write platform-agnostic instructions here.
```

**`claude/agents/my-agent.md`** — Claude shim:
```markdown
---
name: "My Agent"
model: claude-sonnet-4-6
tools: [read, edit]
---
Read and follow the agent instructions at: ~/.ai/agents/my-agent.md
```

**`copilot/agents/my-agent.agent.md`** — Copilot shim (note `.agent.md` extension):
```markdown
---
name: "My Agent"
model: "Claude Sonnet 4.6 (copilot)"
tools: ["read", "edit"]
---
Read and follow the agent instructions at: ~/.ai/agents/my-agent.md
```

Skills with platform-specific content (different schemas, reference URLs, model catalogues)
live in `copilot/skills/` or `claude/skills/` and are copied as-is.

## 💻 Windows Note

The install script requires Bash. Run it from WSL or Git Bash.
Files install to `~/.copilot/`, `~/.claude/`, and `~/.ai/` (e.g. `C:\Users\<you>\.claude\` on Windows).
