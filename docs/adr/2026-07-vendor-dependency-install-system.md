# 2026-07-vendor-dependency-install-system

> **Status:** Active
> **Issue:** [#188 — Overhaul install system to manage third-party dependencies and provide single-command setup](https://github.com/HeadlessTarry/Token-Effort/issues/188)
> **Date:** 2026-07-19

## Context

The install scripts (`install.sh`, `install.ps1`) only copied Token-Effort's own skills and agents to the OpenCode config directory. New users cloning Token-Effort could not get a working setup from a single `install` command — they had to manually install third-party dependencies, configure `opencode.json` plugin entries, and manage each dependency separately.

## Decision

**Modular helpers with declarative manifest.** The install system now uses:

- **`vendor.json`** — a declarative manifest at the repo root listing third-party dependencies as plugins (registered in `opencode.json`) or skills (cherry-picked to OpenCode's skills directory)
- **`lib/`** — platform-specific helper scripts (`vendor.sh`/`vendor.ps1` for repo management, `config.sh`/`config.ps1` for config manipulation) sourced by the main orchestrators
- **`.vendor/`** — gitignored directory for cloned vendor repos (shallow `--depth 1` clones)

Safety measures: timestamped backups of `opencode.json` before modification, JSON validation before/after writes, append-only plugin management (never clobber existing entries), and interactive retry/skip/abort prompts on vendor failures.

Two separate platform scripts are maintained (no cross-platform unification). The new `--update`/`-Update` flag pulls latest for vendor repos. Existing flags (`--local`, `--skill`, `--agent`) are preserved for backward compatibility.

**Scope:** The initial `vendor.json` contains only `superpowers`. Additional vendors may be added in future.

## Consequences

- **Positive:** New users get a single-command setup. Adding new vendors is declarative (edit `vendor.json`, re-run install). Idempotent — safe to re-run.
- **Positive:** `opencode.json` modifications are transparent (diff shown, backup created, user confirms).
- **Trade-off:** Two platform-specific codebases (bash + PowerShell) must be maintained in parallel rather than a unified solution.
- **Limitation:** Vendor skill copying assumes `skills/<name>/` directory structure in the vendor repo. Vendors with different layouts need custom handling.
- **Deferred:** Config file copying for vendor-specific setup (e.g. editor rules) — deferred until a vendor actually requires it (YAGNI).
