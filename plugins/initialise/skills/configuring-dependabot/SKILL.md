---
name: configuring-dependabot
description: Scans a repo for package ecosystems and writes a .github/dependabot.yml with weekly update schedules and cooldown settings. Use when you want to add or update Dependabot configuration for a repository.
user-invocable: true
---

# Configuring Dependabot

## ⛔ Dispatcher — Act on This Before Reading Further

**Do not execute any step below.** Your only action is to spawn a Haiku subagent via the `Agent` tool with `model: haiku`. Embed all instructions under "Subagent Instructions" below verbatim as the subagent prompt, and include this instruction in the prompt: **"Use `AskUserQuestion` for any mid-task user interaction — per-ecosystem conflict resolution prompts and the `.yaml` extension overwrite confirmation."** `AskUserQuestion` is a standard Claude Code tool available to all subagents for synchronous mid-task user prompts. Report the subagent's result to the user without modification.

## 📋 Subagent Instructions — Pass Verbatim, Do Not Execute Directly

### Overview

Scans the repository for package ecosystem indicators and writes `.github/dependabot.yml` with one entry per detected ecosystem. All entries use a weekly schedule; cooldown settings are included only for ecosystems that support them.

**Usage:** `/token-effort-initialise:configuring-dependabot`

Reference: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference

### When to Use

**Use when:**
- You want to add or update Dependabot for a repository
- Invoked by `/token-effort-initialise:init-plus` Step 5

**Do not use when:**
- You only want to inspect which ecosystems are present without writing a file

### Prerequisites

None. All operations are local file reads and writes.

### Process

#### Phase 1 — Scan for ecosystem indicators

Use the Glob tool to check for each of the following patterns from the repo root. Each ecosystem must appear **at most once** in the output list — if multiple file patterns map to the same ecosystem, deduplicate (e.g. both `requirements.txt` and `pyproject.toml` both map to `pip`; only one `pip` entry is written).

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

#### Phase 2 — Check for existing file

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

#### Phase 3 — Write `.github/dependabot.yml`

**When no existing file is present:** write the full file from scratch with one entry per detected ecosystem. Always use `directory: /`.

**When an existing file is present (from the Phase 2 merge):**
- **New** ecosystems: append their YAML block to the end of the `updates:` list
- **Overwrite** decisions: replace the conflicting entry's block in-place (from its `  - package-ecosystem:` line to the line before the next `  - package-ecosystem:` entry, or the end of the `updates:` list)
- **Identical** and **Retain** entries: leave the file untouched

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

The cooldown values below are project-defined defaults, not GitHub defaults. Update both this file and the corresponding training eval (`training/initialise/skills/configuring-dependabot/single-ecosystem-npm.md`) if you change them.

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

**Fresh file (no prior file existed):**
> "Written `.github/dependabot.yml` with entries for: [comma-separated list of ecosystems]."

**Existing file updated:**
> "Updated `.github/dependabot.yml`: added [ecosystems], updated [ecosystems], retained [ecosystems]."

Report key:
- **added** = new ecosystems appended
- **updated** = conflicting ecosystems the user chose to overwrite
- **retained** = conflicting ecosystems the user chose to keep as-is
- Identical entries are silently skipped and do not appear in the report
- Omit any category with zero items

### Common Mistakes

- **Applying cooldown to `github-actions`** — `github-actions` does not support the cooldown option. Never include a `cooldown` block on a `github-actions` entry.
- **Writing duplicate ecosystem entries** — if both `requirements.txt` and `pyproject.toml` exist, write only one `pip` entry. If both `Gemfile` and `*.gemspec` exist, write only one `bundler` entry.
- **Ignoring `.github/dependabot.yaml`** — always check for the `.yaml` variant (wrong extension) in addition to `.yml`. Warn the user if it exists.
- **Writing the file when no ecosystems are detected** — if the scan finds no indicators, output the "no ecosystems" message and stop without writing.
- **Prompting for whole-file overwrite when `.github/dependabot.yml` exists** — use the append-only merge path instead. The whole-file overwrite prompt has been removed; only per-ecosystem conflict prompts are used.
- **Skipping the conflict prompt when an ecosystem is present with different settings** — always ask the user per-conflicting-ecosystem. Never silently overwrite or silently skip a conflicting entry.
- **Failing to detect `.pre-commit-config.yaml`** — this file maps to the `pre-commit` ecosystem. It must be checked in Phase 1 alongside all other indicator files.
- **Using a non-root directory** — always use `directory: /` unless the user specifies otherwise.

### Eval

- [ ] Scanned all seven ecosystem indicator patterns using Glob
- [ ] Deduplicated ecosystems (no duplicate entries for pip, bundler, etc.)
- [ ] Reported "no ecosystems detected" and stopped (no file written) when none found
- [ ] Checked for both `.github/dependabot.yml` and `.github/dependabot.yaml`
- [ ] Warned about `.github/dependabot.yaml` (wrong extension) and asked before proceeding
- [ ] When `.github/dependabot.yml` exists: read file and classified each detected ecosystem as New / Identical / Conflicting before writing
- [ ] Detected `pre-commit` ecosystem when `.pre-commit-config.yaml` is present; no cooldown block written for `pre-commit`
- [ ] Appended only New ecosystems; left Identical entries untouched without any overwrite prompt
- [ ] Asked user per-conflicting-ecosystem (not a whole-file overwrite prompt)
- [ ] Completion report distinguishes added / updated / retained; omits zero-item categories
- [ ] Reported "already up to date" when all detected ecosystems were Identical
- [ ] Wrote one entry per detected ecosystem with `schedule.interval: weekly`
- [ ] Included cooldown block only for ecosystems that support it (not github-actions)
- [ ] Used `directory: /` for all ecosystems
- [ ] Reported which ecosystems were configured after writing
