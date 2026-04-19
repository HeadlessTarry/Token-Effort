# 2026-04-configuring-dependabot-append-only-merge

> **Status:** Active
> **Issue:** [#77 — Add pre-commit ecosystem detection to `/init-plus` Dependabot config generation](https://github.com/HeadlessTarry/Token-Effort/issues/77)
> **Date:** 2026-04-19

## Context

The `/configuring-dependabot` skill scans a repository for package ecosystem indicators and writes `.github/dependabot.yml`. Two gaps were identified: `.pre-commit-config.yaml` was not detected as an ecosystem indicator, and when a `dependabot.yml` already existed the skill prompted for whole-file overwrite — silently destroying any manually maintained configuration including any existing `pre-commit` entries.

## Decision

Added `.pre-commit-config.yaml` → `pre-commit` ecosystem detection to Phase 1. Replaced the whole-file overwrite prompt with an append-only merge in Phase 2: read the existing file, classify each detected ecosystem as New/Identical/Conflicting, append only New ecosystems without prompting, ask per-conflicting-ecosystem whether to overwrite or retain, and skip Identical entries silently. Phase 3 write logic was updated to handle the three-bucket outcome with surgical in-place replacement for Overwrite decisions.

## Consequences

Skills that call `configuring-dependabot` will no longer destructively overwrite existing `dependabot.yml` files; existing manual configurations are preserved. The append-only path increases Phase 2/3 complexity but eliminates the most destructive user-facing footgun. The per-ecosystem conflict prompt is more precise than a whole-file prompt but requires the user to make more decisions when multiple conflicts exist.
