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
