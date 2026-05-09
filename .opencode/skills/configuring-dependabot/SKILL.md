---
name: configuring-dependabot
description: Scans a repository for package ecosystems and writes .github/dependabot.yml with weekly update schedules and cooldown settings. Use when adding or updating Dependabot configuration.
metadata:
  audience: developers
  workflow: initialization
---

# Configuring Dependabot

## Overview

Scans the repository for package ecosystem indicators and writes `.github/dependabot.yml` with one entry per detected ecosystem. All entries use a weekly schedule; cooldown settings are included only for ecosystems that support them.

Reference: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference

## When to Use

**Use when:**
- You want to add or update Dependabot for a repository

**Do not use when:**
- You only want to inspect which ecosystems are present without writing a file

## Prerequisites

None. All operations are local file reads and writes.

## Process

### Phase 1 — Scan for ecosystem indicators

Use the `glob` tool to check for each of the following patterns from the repo root. Each ecosystem must appear **at most once** in the output list — if multiple file patterns map to the same ecosystem, deduplicate (e.g. both `requirements.txt` and `pyproject.toml` both map to `pip`; only one `pip` entry is written).

| File pattern | Ecosystem |
|---|---|
| `package.json` | `npm` |
| `requirements.txt` or `pyproject.toml` | `pip` |
| `*.gemspec` or `Gemfile` | `bundler` |
| `go.mod` | `gomod` |
| `Cargo.toml` | `cargo` |
| `.github/workflows/*.yml` | `github-actions` (include whenever any workflow file exists) |
| `.pre-commit-config.yaml` | `pre-commit` |

Collect all **unique** matching ecosystems into an ordered list (preserve detection order above).

If no ecosystems are detected, output:

> "No package ecosystems detected in this repository. Dependabot configuration not written."

Then stop without writing any file.

### Phase 2 — Check for existing file

Check for **both** `.github/dependabot.yml` and `.github/dependabot.yaml`.

- If `.github/dependabot.yaml` exists (wrong extension): warn the user:

  > "`.github/dependabot.yaml` exists but the canonical filename is `.github/dependabot.yml`. This skill will write `.github/dependabot.yml`. You may want to delete or rename the existing `.yaml` file to avoid having two configs."

  Ask: "Proceed? [yes/no]" — if the user says no, stop without writing.

- If `.github/dependabot.yml` exists, apply an **append-only merge**:

  1. **Read** the file and extract all `package-ecosystem:` values from the `updates:` list using text matching.
  2. **Classify** each detected ecosystem into one of three buckets:
     - **New** — not present in the existing file → will be appended in Phase 3
     - **Identical** — present and matches the standard config (weekly schedule + correct cooldown presence/absence for this ecosystem) → skip silently
     - **Conflicting** — present but differs from standard config (e.g. different schedule interval, unexpected cooldown block) → needs user decision
  3. **Resolve conflicts** — for each conflicting ecosystem, ask:

     > "`<ecosystem>` is already configured but differs from the standard settings. Overwrite with standard config, or retain your existing entry?"

     Ask one ecosystem at a time. Collect all decisions before writing anything.

  If all detected ecosystems are Identical (nothing new, nothing conflicting), report:

  > "`.github/dependabot.yml` is already up to date. No changes made."

  Then stop without writing.
