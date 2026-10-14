# 🪙 Token Effort

> Low-stakes intelligence for high-latency humans

A personal AI toolkit. It configures Claude Code with standing instructions, starter settings, home-grown skills, a choice of third-party skill sets and an optional overhaul mod.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=HeadlessTarry_Token-Effort&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=HeadlessTarry_Token-Effort)

## 🧰 Skill sets

Pick one or both at install:

| Skill set | Plugin | Good for |
|-----------|--------|----------|
| `mattpocock` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | Exploring, researching, deciding and planning work as GitHub issues |
| `pstack` | [`michael-denyer/pstack-claude`](https://github.com/michael-denyer/pstack-claude) | Turning actionable issues into verified pull requests |

Skill sets are defined at the top of `install.sh`.

## 🪙 Core plugin

The `token-effort` plugin is required on every install. It ships:

- **Home-grown skills** from `skills/`, invoked with the plugin prefix (e.g. `/token-effort:report-bug`).
- **Working conventions** (see [GLOSSARY.md](GLOSSARY.md)): `config/AGENTS.md` is added to every session's context and every subagent's, except `Explore` and `Plan`. `$AI_CONFIG_DIR` in it becomes the plugin's `config/` directory, which holds the issue-tracker and triage-label docs from `config/docs/agents/`.
- **`shepherding-pr-reviews`**, a Claude Code-only skill ([ADR 0008](docs/adr/0008-claude-only-pr-review-skill.md)) that walks an open PR through review rounds from human and AI reviewers: a verdict for each comment, fixes for the valid ones, in-thread replies, and an Auto-Fix Halt at the noise or round limit (see [GLOSSARY.md](GLOSSARY.md)). Its hooks bind a PR after `gh pr create` and block a turn from ending while review threads are unanswered; they do nothing in sessions with no bound PR. Arming the Auto-Fix Watch needs the Claude desktop app; in a CLI session, rounds run when you say reviews have landed.
- **`/token-effort:setup`**, which merges the starter settings and permissions from [`plugins/claude/token-effort/config/settings.json`](plugins/claude/token-effort/config/settings.json) into your Claude `settings.json`. Re-runs add any new entries and keep your own; entries you remove come back, so edit that file to change the baseline.

## ⤵️ Installation

Pick one route. Both give Claude Code the same result.

- **Claude Code plugins**: for general use. Updates arrive through plugin auto-update, with no clone to keep.
- **Installer script**: for maintainers of this repo. It installs from your clone, so edits take effect at the next session start (or `/reload-plugins`), and it handles skill sets, settings and cleanup of older installs for you.

### Claude Code plugins

```bash
claude plugin marketplace add HeadlessTarry/Token-Effort
claude plugin install token-effort@token-effort
claude plugin install under-empire@token-effort   # optional overhaul mod
```

Then:

1. Run `/token-effort:setup` in a session (needs Node.js) to merge the starter settings.
2. Turn on auto-update for the `token-effort` marketplace in `/plugin` → Marketplaces.
3. Install the skill sets you want yourself, from the repos above.
4. Upgrading from an `install.sh` install made before the core plugin? Delete `~/.claude/AGENTS.md`, `~/.claude/docs/agents/issue-tracker.md`, `~/.claude/docs/agents/triage-labels.md`, and the copied skills `~/.claude/skills/<name>/` for each skill in `skills/`. Otherwise the conventions load twice and each skill appears twice.

### Installer script

From a clone:

```bash
./install.sh
```

Re-run it any time to update. It is safe to repeat; your answers are remembered in `~/.claude/.token-effort-state`.

| Flag | Effect |
|------|--------|
| `--skills <id,...\|all>` | Pick skill sets, e.g. `--skills pstack` or `--skills all`. Skill sets left out are uninstalled |
| `--overhaul <id\|none>` | Pick an overhaul mod from `plugins/claude/overhaul-mods/`, or `none` (the default) |
| `--reconfigure` | Ask every question again |

It configures `~/.claude`, or `$CLAUDE_CONFIG_DIR` when that is set. If the directory doesn't exist yet it is created; run `claude` afterwards to log in.

It registers the clone as the `token-effort` marketplace, installs the core plugin, the overhaul mod and the skill sets, and runs the same settings merge as `/token-effort:setup`. Every run also deletes the copies older installs made: `AGENTS.md`, `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, and `skills/<name>/` for each skill in `skills/`. Nothing else under `skills/` is touched.

It ends with a list of next steps (`/setup-pstack`, and `/setup-matt-pocock-skills` (accept only the domain docs) or `/create-verification-skill` once per repo, depending on your skill sets). It never runs slash commands itself.

### Prerequisites

- [Claude Code](https://claude.com/claude-code) CLI
- [Node.js](https://nodejs.org/) (for the core plugin's hooks and the settings merge)
- [gh CLI](https://cli.github.com/), authenticated with `gh auth login`
- Bash (Git Bash on Windows), for `install.sh`

## 🎭 Overhaul mods

An overhaul mod is one Claude Code plugin that reskins Claude Code around a single theme by bundling several features, such as an output style and a hook (see [GLOSSARY.md](GLOSSARY.md)). Pick one during install, or `none`. It is all-or-nothing: you get the whole overhaul mod or none of it, and choosing one uninstalls any other overhaul mod from the `token-effort` marketplace (`.claude-plugin/marketplace.json`).

| Overhaul mod | What you get |
|--------------|--------------|
| [`under-empire`](plugins/claude/overhaul-mods/under-empire/README.md) | The `Warlock Engineer` output style (a scheming Skaven voice for prose, plain professional artefacts), a reminder hook that keeps the voice on, and the Underlings pane, which shows running subagents and background tasks as Skaven rats |

To add one, create `plugins/claude/overhaul-mods/<id>/` with a `.claude-plugin/plugin.json` and add a `marketplace.json` entry. No script change is needed. Plugins here set no `version`, so each commit is a new version and `claude plugin update` picks it up.

## 🗂️ Directory Structure

```
install.sh           → installer and updater
setup_dev_env.sh     → installs git hooks for local development
run_checks.sh        → local and CI checks (pre-commit)
scripts/             → custom check scripts used by pre-commit
.claude-plugin/      → marketplace "token-effort" (core plugin entry and overhaul mods)
config/              → working conventions: AGENTS.md and docs/agents/*.md
skills/              → home-grown skills
plugins/claude/      → Claude Code-only content
  token-effort/      → core plugin assets: Claude-only skills, settings.json, scripts
  overhaul-mods/<id>/→ overhaul mod plugins
docs/                → ADRs, agent docs and developer docs
```

## 🤝 Contributing

All changes to skill files use mattpocock's `writing-for-agents` skill. See `AGENTS.md`.

Run `./setup_dev_env.sh` once per clone to install the git hooks, and `./run_checks.sh` before pushing. See [Development Environment](docs/development_environment.md) and [Running Checks](docs/running-checks.md).
