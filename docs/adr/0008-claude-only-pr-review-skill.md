# 0008-claude-only-pr-review-skill

> **Status:** Accepted
> **Date:** 2026-10-14

## Context

`shepherding-pr-reviews` (issue #227) walks an open PR through review rounds: it triages each review comment to a verdict, fixes the valid ones, replies in-thread and resolves. It needs a `PostToolUse` hook (after `gh pr create`), a `Stop` hook (block the turn while answerable threads remain), and the Claude desktop app's `mcp__ccd_pr__set_monitor` tool and `<ci-monitor-event>` messages. No other Agent Skills platform has these, so it is the first home-grown skill that cannot be portable.

## Decision

`shepherding-pr-reviews` is a **Claude-only skill** in the core plugin.

- **Location.** The skill and its script live in `plugins/claude/token-effort/skills/shepherding-pr-reviews/`, per the Claude-only split in [0007-core-plugin.md](./0007-core-plugin.md). It does not go in `skills/`. Its `SKILL.md` still uses only Skill frontmatter fields ([0004](./0004-portable-skill-frontmatter.md)).
- **Hooks.** The `PostToolUse` (Bash/PowerShell) and `Stop` hooks are declared inline in the core plugin's marketplace entry, next to the conventions hooks.
- **Runtime.** The script is Node with no dependencies, like the core plugin's other scripts. It is a port of the Python 3 original in #224, so the core plugin needs only one runtime.
- **Disclosure.** Replies and PR comments carry the banner from the `disclose-ai-content` skill, so one banner is used across the repo.

Rejected alternatives:

- **Its own opt-in plugin.** Users would not pay for the always-on hooks. But it would add a third kind of plugin, an extra install step and an `install.sh` flag, for hooks that are a cheap no-op when no PR is bound.
- **Skill in `skills/`, hooks in the core plugin.** This would put Claude-only content in the platform-neutral folder.
- **Keep Python.** No port is needed, but the core plugin would need a second runtime and a Windows/Linux interpreter shim (`py.exe` vs `python3`).

## Consequences

- Limitation: Claude Code only. Other Agent Skills platforms get no PR review skill.
- Limitation: the Auto-Fix Watch needs the Claude desktop app. A CLI session has no `set_monitor` or `<ci-monitor-event>`. After `gh pr create` the skill tells the human the Auto-Fix Watch is not armed, and a round runs only when the human says reviews have landed. The `Stop` hook still blocks a turn while answerable threads remain.
- Limitation: both hooks run in every session with the core plugin installed. They must exit quickly when no `gh pr create` ran and no PR is bound to the session.
- The skill owned an output contract the Doomwheel mod read (#230), until #245 decoupled Doomwheel from the skill and removed the contract.
