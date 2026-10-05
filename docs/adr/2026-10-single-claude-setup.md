# 2026-10-single-claude-setup

> **Status:** Accepted
> **Date:** 2026-10-05
> **Supersedes:** [2026-10-lab-forge-agent-areas.md](./2026-10-lab-forge-agent-areas.md)

## Context

The Lab and Forge areas isolated two skill sets (`mattpocock/skills` and `michael-denyer/pstack-claude`) in separate `CLAUDE_CONFIG_DIR`s. After a day of use the split cost more than it saved:

- Two sets of Claude config files to manage.
- Each area needed its own "trusted folder" grants, which can't easily be managed through files.
- Behaviour meant for both areas needed a third location for shared `AGENTS.md` reference files.
- Plugins and skills could drift apart (e.g. versions) when one area missed an update.
- Claude history was split across the two areas, making self-retrospection harder.

There was no concrete problem behind the split beyond isolating the two skill sets, and that isolation is available in a single setup by installing only one of them.

## Decision

One Claude Code setup in the default `~/.claude`.

- **`install.sh` configures `~/.claude`** (or `$CLAUDE_CONFIG_DIR` when set, creating it if missing). It merges `config/settings.json` into its `settings.json` and copies `config/AGENTS.md` to its `AGENTS.md`.
- **Skill sets are chosen at install** (`--skills <id,...|all>`), defined in a table at the top of `install.sh`. Deselected skill sets are uninstalled on the next run, as personas already are.
- **Every home-grown skill in `skills/` is always installed**, whichever skill sets are chosen. With one install target there is nothing to choose per skill, so the per-area `manifest` is gone.
- **One persona** (`--persona`), as before.
- **Dropped:** the `claude-lab` / `claude-forge` shell functions, Zed `agent_servers` configuration and the IDE question, and the `manifest` file.

## Consequences

- One history, one set of trust grants, one place to update.
- Skill sets are no longer isolated from each other when both are installed; installing only one is how to isolate.
- `effortLevel`, permissions and worktree settings formerly Forge-only now apply everywhere; the default `model` is `opus`.
- Existing Lab and Forge installs are reverted by hand; the new installer does not remove them.
