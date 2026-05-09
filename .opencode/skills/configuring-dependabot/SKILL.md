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
