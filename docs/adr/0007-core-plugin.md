# 0007-core-plugin

> **Status:** Accepted
> **Date:** 2026-10-14
> **Supersedes:** the install parts of [0003-single-claude-setup.md](./0003-single-claude-setup.md) and [0005-user-level-working-conventions.md](./0005-user-level-working-conventions.md)

## Context

`install.sh` delivered the home-grown skills and working conventions by side effect: it copied `config/AGENTS.md` and `config/docs/agents/*.md` into the Claude config root, ran `npx skills add` for each skill, and merged starter settings into `settings.json`. Someone installing through `claude plugin …` got only the overhaul mods, so the two install routes gave different results.

## Decision

Ship the skills and working conventions as the **core plugin** (see [GLOSSARY.md](../../GLOSSARY.md)), `token-effort`, from the existing `token-effort` marketplace. Both routes install it: `claude plugin install token-effort@token-effort` from GitHub, and `./install.sh` from a clone.

- **The marketplace entry is the manifest.** The entry has `"source": "./"`, the repo root, and the root has no `.claude-plugin/plugin.json`, so the entry alone defines the plugin. It lists `skills: ["./skills/", "./plugins/claude/token-effort/skills/"]` and declares its hooks inline; an entry `hooks` written as a file path passes `claude plugin validate` but never runs.
- **The repo root stays free of default-named components** (`.claude-plugin/plugin.json`, `hooks/`, `agents/`, `commands/`, `bin/`, `output-styles/`, `settings.json`, `.mcp.json`, `.lsp.json`), because they would change what the core plugin loads. `scripts/check_plugins.py` fails when one appears.
- **Platform-neutral content stays where it is**: `skills/` (Agent Skills spec, [0004](./0004-portable-skill-frontmatter.md)), `config/AGENTS.md` and `config/docs/agents/*.md`. **Claude-only content lives under `plugins/claude/`**: core plugin assets in `plugins/claude/token-effort/` (the `setup` skill, `config/settings.json`, scripts), and overhaul mods in `plugins/claude/overhaul-mods/<id>/` (moved from `overhaul-mods/`).
- **Conventions arrive by hook.** `inject-conventions.js` reads `config/AGENTS.md`, replaces `$AI_CONFIG_DIR` with the plugin's `config/` directory, and prints it on `SessionStart`. On `SubagentStart` it returns the same text as `additionalContext`, except for `Explore` and `Plan`, which never received `~/.claude/AGENTS.md` either.
- **One settings merge.** `plugins/claude/token-effort/scripts/merge-settings.js` holds the deep merge `install.sh` used. `install.sh` and `/token-effort:setup` both call it, so the plugin route can apply the same starter settings.
- **No `version`** on the core plugin entry or on overhaul mods, so every commit is a new version.
- **`install.sh` deletes the copies older installs made** on every run: `AGENTS.md`, `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, and `skills/<name>/` for each skill in `skills/`. It no longer copies files or runs `npx skills add`.

Rejected alternatives:

- **A plugin folder with copies or symlinks of `skills/` and `config/`.** Copies drift. Symlinks are skipped on local-path installs (`Local source "x" is or traverses a symlink`), which is how `install.sh` installs.
- **A `plugin.json` at the repo root.** It would load every default-named folder at the root as a component, and conflicts with an entry that also lists components.

## Consequences

- Both routes give the same skills, conventions and settings; the plugin route needs one manual `/token-effort:setup` run.
- Skills gain the plugin prefix, e.g. `/token-effort:report-bug`.
- Conventions load from the installed plugin, so a commit reaches every session after the next plugin update, with no copy step.
- Platform scope: Claude Code only. Non-Claude platforms have no install route.
- Limitation: the plugin route does not remove an older install's copies; the README lists them for manual deletion.
- Limitation: the plugin route does not install skill sets or enable marketplace auto-update; the user does both by hand.
