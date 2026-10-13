# 0006-overhaul-mods

> **Status:** Accepted
> **Date:** 2026-10-13
> **Supersedes:** the persona parts of [0003-single-claude-setup.md](./0003-single-claude-setup.md)

## Context

A persona was a tiny plugin holding an output style and a reminder hook. The Skaven theme is growing beyond a voice into mods that change Claude Code's own interface (see #225). "Persona" describes only the voice, so it no longer fits a plugin that reskins Claude Code around a theme.

## Decision

Retire personas. Ship themes as **overhaul mods** (see [GLOSSARY.md](../../GLOSSARY.md)).

- **One overhaul mod per theme**, each a plugin in `overhaul-mods/<id>/` served through the local `token-effort` marketplace. The Skaven persona becomes `under-empire`, whose output style is `Warlock Engineer`.
- **All-or-nothing.** `install.sh --overhaul <id|none>` installs one whole overhaul mod, or none (the default), and uninstalls every other `token-effort` plugin. Features inside an overhaul mod are not picked individually.
- **Mods may bolt on to Token-Effort skills.** The skill owns what the mod reads; without the skill the mod stays out of sight rather than failing.
- **`--persona` is removed**, with no alias. A saved `persona` state entry is migrated once to `overhaul` (`skaven` → `under-empire`, `Default` → `none`).

## Consequences

- New themes and mods need no installer change: add a folder and a marketplace entry.
- An overhaul mod can grow features without new install flags; the cost is no per-feature choice.
- Scripts or habits using `--persona` break and must switch to `--overhaul`.
