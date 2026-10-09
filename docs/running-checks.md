# 🏃 Running Checks

Run all project checks to confirm changes are working correctly. CI runs the same script.

## ⚡ Quick Reference

```bash
./run_checks.sh
```

## 🔍 What `run_checks.sh` Runs

Pre-commit hooks on all files (see [.pre-commit-config.yaml](../.pre-commit-config.yaml)):

| Hook | Checks |
|------|--------|
| `shellcheck` | Shell scripts, plus `[[ ]]` over `[ ]` and a default `*)` branch in every `case` |
| `bash-syntax` | Shell scripts parse (`bash -n`) |
| `positional-params` | `$1`..`$9` are only read to assign a named variable ([scripts/check_positional_params.py](../scripts/check_positional_params.py)) |
| `shell-header` | Shell scripts open with `#!/usr/bin/env bash` and their first statement is `set -euo pipefail` ([scripts/check_shell_header.py](../scripts/check_shell_header.py)) |
| `markdown-links` | Relative Markdown links point at files that exist; offline, URLs are not fetched ([scripts/check_md_links.py](../scripts/check_md_links.py)) |
| `skill-spec` | Each `skills/*/SKILL.md` passes `skills-ref` 0.1.1, the Agent Skills spec validator; alpha, "demonstration purposes only", no release since 2026-01-10 ([scripts/check_skill_spec.py](../scripts/check_skill_spec.py)) |

These hooks run on commit only, once installed by `./setup_dev_env.sh`:

| Hook | Checks |
|------|--------|
| `no-commit-to-branch` | No commits directly to `main` (skipped by `run_checks.sh`) |
| `commit-msg-format` | Commit summary is `type: Summary`, with `type` one of `feat`, `fix`, `docs`, `chore` |

SonarQube runs only in CI, after `run_checks.sh` passes.

## 🧩 Individual Commands

```bash
# One hook, all files
uvx --no-build pre-commit run shellcheck --all-files

# All hooks, specific files
uvx --no-build pre-commit run --files install.sh README.md
```
