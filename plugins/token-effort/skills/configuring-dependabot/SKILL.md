---
name: configuring-dependabot
description: Scans a repo for package ecosystems and writes a .github/dependabot.yml with weekly update schedules and cooldown settings. Use when you want to add or update Dependabot configuration for a repository.
user-invocable: true
---

# Configuring Dependabot

## Overview

Scans the repository for package ecosystem indicators and writes `.github/dependabot.yml` with one entry per detected ecosystem. All entries use a weekly schedule; cooldown settings are included only for ecosystems that support them.

**Usage:** `/token-effort:configuring-dependabot`

Reference: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference

## When to Use

**Use when:**
- You want to add or update Dependabot for a repository
- Invoked by `/token-effort:init-plus` Step 5

**Do not use when:**
- You only want to inspect which ecosystems are present without writing a file

## Prerequisites

None. All operations are local file reads and writes.

## Process

### Phase 1 — Scan for ecosystem indicators

Use the Glob tool to check for each of the following patterns from the repo root. Each ecosystem must appear **at most once** in the output list — if multiple file patterns map to the same ecosystem, deduplicate (e.g. both `requirements.txt` and `pyproject.toml` both map to `pip`; only one `pip` entry is written).

| File pattern | Ecosystem |
|---|---|
| `package.json` | `npm` |
| `requirements.txt` or `pyproject.toml` | `pip` |
| `*.gemspec` or `Gemfile` | `bundler` |
| `go.mod` | `gomod` |
| `Cargo.toml` | `cargo` |
| `.github/workflows/*.yml` | `github-actions` (include whenever any workflow file exists) |

Collect all **unique** matching ecosystems into an ordered list (preserve detection order above).

If no ecosystems are detected, output:

> "No package ecosystems detected in this repository. Dependabot configuration not written."

Then stop without writing any file.

### Phase 2 — Check for existing file

Check for **both** `.github/dependabot.yml` and `.github/dependabot.yaml`.

- If `.github/dependabot.yaml` exists (wrong extension): warn the user:

  > "`.github/dependabot.yaml` exists but the canonical filename is `.github/dependabot.yml`. This skill will write `.github/dependabot.yml`. You may want to delete or rename the existing `.yaml` file to avoid having two configs."

  Ask: "Proceed? [yes/no]" — if the user says no, stop without writing.

- If `.github/dependabot.yml` exists: warn the user:

  > "`.github/dependabot.yml` already exists. Overwrite? [yes/no]"

  Wait for user confirmation. If the user says no or skips, stop without writing.

### Phase 3 — Write `.github/dependabot.yml`

Write the file with one entry per detected ecosystem. Always use `directory: /`.

**Cooldown support:** Only include the `cooldown` block for ecosystems that support it. The following ecosystems do **NOT** support cooldown and must not have a `cooldown` block:

- `github-actions`
- `docker`
- `terraform`
- `git-submodule`
- `helm`
- `conda`
- `pre-commit`
- `devcontainers`

All other ecosystems detected by this skill (`npm`, `pip`, `bundler`, `gomod`, `cargo`) **do** support cooldown and must include the full `cooldown` block.

The cooldown values below are project-defined defaults, not GitHub defaults. Update both this file and the corresponding training eval (`training/skills/configuring-dependabot/single-ecosystem-npm.md`) if you change them.

Example output for a repo with `npm` (supports cooldown) and `github-actions` (does not):

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    cooldown:
      default-days: 20
      semver-patch-days: 10
      semver-minor-days: 20
      semver-major-days: 30

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

After writing, report:

> "Written `.github/dependabot.yml` with entries for: [comma-separated list of ecosystems]."

## Common Mistakes

- **Applying cooldown to `github-actions`** — `github-actions` does not support the cooldown option. Never include a `cooldown` block on a `github-actions` entry.
- **Writing duplicate ecosystem entries** — if both `requirements.txt` and `pyproject.toml` exist, write only one `pip` entry. If both `Gemfile` and `*.gemspec` exist, write only one `bundler` entry.
- **Ignoring `.github/dependabot.yaml`** — always check for the `.yaml` variant (wrong extension) in addition to `.yml`. Warn the user if it exists.
- **Writing the file when no ecosystems are detected** — if the scan finds no indicators, output the "no ecosystems" message and stop without writing.
- **Skipping the overwrite confirmation** — always warn and ask if `.github/dependabot.yml` (or `.yaml`) exists.
- **Using a non-root directory** — always use `directory: /` unless the user specifies otherwise.

## Eval

- [ ] Scanned all six ecosystem indicator patterns using Glob
- [ ] Deduplicated ecosystems (no duplicate entries for pip, bundler, etc.)
- [ ] Reported "no ecosystems detected" and stopped (no file written) when none found
- [ ] Checked for both `.github/dependabot.yml` and `.github/dependabot.yaml`
- [ ] Warned about `.github/dependabot.yaml` (wrong extension) and asked before proceeding
- [ ] Warned about existing `.github/dependabot.yml` and asked before overwriting
- [ ] Wrote one entry per detected ecosystem with `schedule.interval: weekly`
- [ ] Included cooldown block only for ecosystems that support it (not github-actions)
- [ ] Used `directory: /` for all ecosystems
- [ ] Reported which ecosystems were configured after writing
