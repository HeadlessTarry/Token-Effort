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
| `--persona <name>` | Pick `Default` or a persona from `personas/` |
| `--reconfigure` | Ask every question again |

It configures `~/.claude`, or `$CLAUDE_CONFIG_DIR` when that is set. If the directory doesn't exist yet it is created; run `claude` afterwards to log in.

Starter settings and permissions come from `config/settings.json`. Re-runs add any new entries and keep your own; entries you remove will come back, so edit `config/settings.json` to change the baseline.

Standing instructions come from `config/AGENTS.md`, copied to `~/.claude/AGENTS.md` on every run, so edit the repo copy rather than the installed one.

It ends with a list of next steps (`/setup-pstack`, and `/setup-matt-pocock-skills` or `/create-verification-skill` once per repo, depending on your skill sets). It never runs slash commands itself.

### Prerequisites

- [Claude Code](https://claude.com/claude-code) CLI
- [Node.js](https://nodejs.org/) (for `npx skills`)
- [gh CLI](https://cli.github.com/), authenticated with `gh auth login`
- Bash (Git Bash on Windows)

## 🎭 Personas

You can pick a persona during install: `Default` (none) or a plugin from `personas/`. A persona is a tiny plugin holding an output style and a reminder hook, served through the local `token-effort` marketplace (`.claude-plugin/marketplace.json`).

To add one, create `personas/<id>/` and add a `marketplace.json` entry. No script change is needed. Bump the plugin `version` when you edit a persona, otherwise `claude plugin update` may not refresh the cached copy.

## 🗂️ Directory Structure

```
install.sh           → installer and updater
.claude-plugin/      → marketplace "token-effort" (personas)
config/              → settings.json merged into ~/.claude, AGENTS.md instructions
personas/<id>/       → persona plugins
skills/              → home-grown skills
docs/                → ADRs and agent docs
```

## 🤝 Contributing

All changes to skill files use mattpocock's `writing-for-agents` skill, and skills are verified with pstack's `eval` playbook. See `AGENTS.md`.
