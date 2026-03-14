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

Files install to `~/.copilot/`. Agents are available via `@Customiser` in Copilot Chat. Skills load automatically when relevant.

### Claude Code

Files install to `~/.claude/`. Agents are available via `/agents` in Claude Code. Skills load automatically when relevant, or invoke directly with `/skill-name`.

## 🏗️ Adding New Agents

Agents that work on both platforms live in `agents/` as a single source file. Each file has two platform sections and a shared body:

```
#[platform:copilot]
# PLATFORM: GitHub Copilot
# MY_VAR: some value for Copilot
---
name: "My Agent"
model: "Claude Sonnet 4.6 (copilot)"
tools: ["read", "edit"]
---

#[platform:claude]
# PLATFORM: Claude Code
# MY_VAR: some other value for Claude
---
name: "My Agent"
model: claude-sonnet-4-6
tools: [read, edit]
---

#[body]
You are an expert in {{PLATFORM}} things.
Here is my platform-specific value: {{MY_VAR}}.
```

- **`#[platform:X]`** — marks the start of a platform section
- **`# KEY: value`** lines above `---` — metadata read by the install script, stripped from the final file
- **`{{KEY}}`** in `#[body]` — replaced with the matching `# KEY: value` from the active platform section
- Adding a new substitution variable requires only a `# VAR: value` line in each platform section and a `{{VAR}}` in the body — no changes to `install.sh`
- Output filenames are derived automatically: `my-agent.agent.md` for Copilot, `my-agent.md` for Claude

Skills with platform-specific content (different schemas, reference URLs, model catalogues) live in `github-copilot/skills/` or `claude/skills/` and are copied as-is.

## 💻 Windows Note

The install script requires Bash. Run it from WSL or Git Bash.
Files install to `~/.copilot/` and/or `~/.claude/` (e.g. `C:\Users\<you>\.copilot\` on Windows).
