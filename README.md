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
   ./install.sh --copy
   ```

Everything under `claude/` gets copied to `~/.claude/`. That's it.

## 🏗️ Structure

```
claude/
├── agents/      →  ~/.claude/agents/
├── commands/    →  ~/.claude/commands/
├── hooks/       →  ~/.claude/hooks/
├── scripts/     →  ~/.claude/scripts/
├── skills/      →  ~/.claude/skills/
└── ...
```

Add something here, run `./install.sh`, it appears in Claude Code. Profound.

## ➕ Adding Things

Drop files under `claude/` mirroring where they should land in `~/.claude/`. Re-run `./install.sh` to deploy.

## 💻 Windows Note

Requires Bash. Run from WSL or Git Bash. `~` resolves to `C:\Users\<you>\`.
