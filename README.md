# 🪙 Token Effort

> Low-stakes intelligence for high-latency humans

A collection of Claude Code agents and skills that do just enough to avoid being replaced by a shell script.

## 🚀 Getting Started

1. Clone the repo:

   ```bash
   git clone https://github.com/TheTarry/Token-Effort.git
   cd Token-Effort
   ```

2. Run the installer:

   ```bash
   ./install.sh
   ```

Everything under `claude/` gets copied to `~/.claude/`. That's it.

## 🏗️ Structure

```
claude/
├── agents/      →  ~/.claude/agents/
├── skills/      →  ~/.claude/skills/
└── ...
```

Add something here, run `./install.sh`, it appears in Claude Code. Profound.

## 🤖 Agents

| Agent | What it does |
|---|---|
| *(none yet)* | Coming soon, probably |

## 🧠 Skills

| Skill | What it does |
|---|---|
| **fix-issues** | Fetches open GitHub issues labelled `claude` and fixes them — one branch, one PR each. |

## ➕ Adding Things

Drop files under `claude/` mirroring where they should land in `~/.claude/`. Re-run `./install.sh` to deploy.

Agents go in `claude/agents/`. Skills go in `claude/skills/`. Claude Code docs cover the rest.

## 💻 Windows Note

Requires Bash. Run from WSL or Git Bash. `~` resolves to `C:\Users\<you>\`.
