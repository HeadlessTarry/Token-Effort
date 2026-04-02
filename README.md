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

   > **Prerequisites:** Bash is required (WSL or Git Bash on Windows). Python 3 is required for hook installation.

   ```bash
   ./install.sh --copy
   ```

   Other options: `--force` removes existing files first, `--uninstall` removes installed files, `--dry-run` previews changes without applying them (no other flag needed).

Everything under `claude/` gets copied to `~/.claude/`. That's it.

## 🏗️ Structure

```
claude/
├── agents/      →  ~/.claude/agents/
├── hooks/       →  ~/.claude/hooks/  +  entry added to ~/.claude/settings.json
└── skills/      →  ~/.claude/skills/

training/
└── <type>/<name>/   →  eval cases for the /run-training skill (committed to git)

documentation/
└── *.md             →  guides and reference docs for this repo
```

Add something `claude/*`, run `./install.sh`, it appears in Claude Code. Profound.

Other supported types (`commands/`, `hooks/`, `scripts/`) can be added — the installer handles them automatically when the directory exists.

## 🧪 Training

Skills and agents in this repo can be iteratively improved using the `/run-training` skill, which evaluates definitions against committed test cases and proposes targeted mutations to improve them.

See [documentation/training-guide.md](documentation/training-guide.md) for the full guide.

## ➕ Adding Things

Drop files under `claude/` mirroring where they should land in `~/.claude/`. Re-run `./install.sh` to deploy.

Agents go in `claude/agents/<name>.md`. Skills go in `claude/skills/<name>/SKILL.md`. See existing entries for reference.

## 💻 Windows Note

Requires Bash. Run from WSL or Git Bash. `~` resolves to `C:\Users\<you>\`, so files install to `C:\Users\<you>\.claude\`.
