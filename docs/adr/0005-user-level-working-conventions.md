# 0005-user-level-working-conventions

> **Status:** Accepted
> **Date:** 2026-10-09

## Context

`/setup-matt-pocock-skills` wrote `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md` into every repo, with matching `### Issue tracker` and `### Triage labels` sections in each repo's `AGENTS.md`. The content describes how the maintainer tracks work, which is the same in every repo, so the copies drifted and each new repo needed its own.

## Decision

Treat these as **working conventions** (see [GLOSSARY.md](../../GLOSSARY.md)) and install them once per user.

- The canonical sources are `config/docs/agents/issue-tracker.md` and `config/docs/agents/triage-labels.md`.
- Every `install.sh` run replaces `<config-root>/docs/agents/*.md` with them, whichever skill sets are chosen. Local edits to installed copies are experiments and get overwritten.
- `config/AGENTS.md` carries the `### Issue tracker` and `### Triage labels` pointers. Paths use the placeholder `$AI_CONFIG_DIR`, which `install.sh` replaces with the platform's config root (Claude: `$CLAUDE_CONFIG_DIR`, else `~/.claude`) in every file it installs. Each platform supplies its root through `platform_config_dir`.
- The "PRs as a request surface" flag is `no` everywhere, with no per-repo override.
- Repos delete their copies and keep only `### Domain docs`, which stays a repo convention.

Rejected alternatives:

- **Sync per-repo copies.** Keeps the drift risk and needs tooling to push changes to every repo.
- **Inline into the global `AGENTS.md`.** Skills read `docs/agents/*.md` by name, so the files need to exist; inlining also loads the full text into every session.

## Consequences

- One edit in this repo updates every repo after the next `install.sh` run.
- Platform scope: Claude Code only. Another platform needs a `platform_config_dir` entry.
- Limitation: mattpocock/skills v1.3.1 `code-review` checks for a repo-local `docs/agents/issue-tracker.md` and may suggest `/setup-matt-pocock-skills` when it is missing. The global pointer tells the agent to use the installed copy instead.
- Limitation: no per-repo override of the PR-surface flag.
