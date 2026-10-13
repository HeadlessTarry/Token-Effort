# 🪙 Token Effort

> Low-stakes intelligence for high-latency humans

A personal AI toolkit. It configures Claude Code in your existing `~/.claude` with standing instructions, starter settings, a choice of third-party skill sets, and home-grown skills.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=HeadlessTarry_Token-Effort&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=HeadlessTarry_Token-Effort)

## 🧰 Skill sets

Pick one or both at install:

| Skill set | Plugin | Good for |
|-----------|--------|----------|
| `mattpocock` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | Exploring, researching, deciding and planning work as GitHub issues |
| `pstack` | [`michael-denyer/pstack-claude`](https://github.com/michael-denyer/pstack-claude) | Turning actionable issues into verified pull requests |

Every home-grown skill in `skills/` is always installed. Skill sets are defined at the top of `install.sh`.

## ⤵️ Installation

```bash
./install.sh
```

Re-run it any time to update. It is safe to repeat; your answers are remembered in `~/.claude/.token-effort-state`.

| Flag | Effect |
|------|--------|
| `--skills <id,...\|all>` | Pick skill sets, e.g. `--skills pstack` or `--skills all`. Skill sets left out are uninstalled |
| `--overhaul <id\|none>` | Pick an overhaul mod from `overhaul-mods/`, or `none` (the default) |
| `--reconfigure` | Ask every question again |

It configures `~/.claude`, or `$CLAUDE_CONFIG_DIR` when that is set. If the directory doesn't exist yet it is created; run `claude` afterwards to log in.

Starter settings and permissions come from `config/settings.json`. Re-runs add any new entries and keep your own; entries you remove will come back, so edit `config/settings.json` to change the baseline.

Standing instructions come from `config/AGENTS.md`, and the issue-tracker and triage-label docs from `config/docs/agents/`. Every run replaces `~/.claude/AGENTS.md` and `~/.claude/docs/agents/*.md` with these, so edit the repo copies rather than the installed ones. `$AI_CONFIG_DIR` in them becomes the config directory.

It ends with a list of next steps (`/setup-pstack`, and `/setup-matt-pocock-skills` (accept only the domain docs) or `/create-verification-skill` once per repo, depending on your skill sets). It never runs slash commands itself.

### Prerequisites

- [Claude Code](https://claude.com/claude-code) CLI
- [Node.js](https://nodejs.org/) (for `npx skills`)
- [gh CLI](https://cli.github.com/), authenticated with `gh auth login`
- Bash (Git Bash on Windows)

## 🎭 Overhaul mods

An overhaul mod is one Claude Code plugin that reskins Claude Code around a single theme by bundling several features, such as an output style and a hook (see [GLOSSARY.md](GLOSSARY.md)). Pick one during install, or `none`. It is all-or-nothing: you get the whole overhaul mod or none of it, and choosing one uninstalls any other plugin from the local `token-effort` marketplace (`.claude-plugin/marketplace.json`).

| Overhaul mod | What you get |
|--------------|--------------|
| `under-empire` | The `Warlock Engineer` output style (a scheming Skaven voice for prose, plain professional artefacts) and a reminder hook that keeps the voice on |

To add one, create `overhaul-mods/<id>/` with a `.claude-plugin/plugin.json` and add a `marketplace.json` entry. No script change is needed. Bump the plugin `version` when you edit an overhaul mod, otherwise `claude plugin update` may not refresh the cached copy.

## 🗂️ Directory Structure

```
install.sh           → installer and updater
setup_dev_env.sh     → installs git hooks for local development
run_checks.sh        → local and CI checks (pre-commit)
scripts/             → custom check scripts used by pre-commit
.claude-plugin/      → marketplace "token-effort" (overhaul mods)
config/              → settings.json merged into ~/.claude, AGENTS.md instructions
overhaul-mods/<id>/  → overhaul mod plugins
skills/              → home-grown skills
docs/                → ADRs, agent docs and developer docs
```

## 🤝 Contributing

All changes to skill files use mattpocock's `writing-for-agents` skill. See `AGENTS.md`.

Run `./setup_dev_env.sh` once per clone to install the git hooks, and `./run_checks.sh` before pushing. See [Development Environment](docs/development_environment.md) and [Running Checks](docs/running-checks.md).
