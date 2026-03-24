---
name: starting-git-branch
description: Use when about to start a new feature, bug fix, or GitHub issue and a fresh git branch is needed from an up-to-date main.
user-invocable: true
---

# Git: Start a Branch

## Overview

New branches must always diverge from an up-to-date main. This skill ensures the working tree is clean, main is current, and the branch is named consistently before any implementation work begins.

**Not needed when:** already on the correct feature branch, or when the repo has no remote (skip step 2).

## Workflow

### 1. Check for uncommitted changes

```bash
git status --short
```

If there are uncommitted changes, **stop and tell the user** — do not proceed. Ask them to commit, stash, or discard the changes before continuing.

### 2. Switch to main and pull latest

If the repo's default branch is not `main`, substitute it throughout.

```bash
git checkout main
git pull
```

If `git pull` fails (e.g. diverged history, merge conflict), stop and report the error. Do not attempt to resolve it automatically.

### 3. Determine the branch name

| Situation | Branch name |
|-----------|-------------|
| GitHub issue number available in context | `feature/<issue-number>` (e.g. `feature/42`) |
| No issue number | Ask the user; normalise spaces to hyphens |

### 4. Check if the branch already exists

```bash
git branch --list <branch-name>
```

If it exists locally, warn the user and ask: switch to it, or use a different name? Wait for their decision before continuing.

### 5. Create and switch to the branch

```bash
git checkout -b <branch-name>
```

Tell the user: "Now on [branch name], branched from main."

## Common Mistakes

- Branching from the current branch instead of main — always `git checkout main` first.
- Proceeding despite uncommitted changes — stop and surface them to the user.
- Auto-resolving a failed `git pull` — report the error and wait for the user.
- Inventing a branch name when an issue number is available — prefer `feature/<issue-number>`.

## Eval

- [ ] Ran `git status --short` before doing anything else
- [ ] Stopped and informed the user if uncommitted changes were present
- [ ] Switched to main and pulled before creating the branch
- [ ] Stopped and reported any `git pull` failure without attempting to fix it
- [ ] Used `feature/<issue-number>` when an issue number was available in context
- [ ] Asked the user for a name when no issue number was available
- [ ] Checked whether the branch already existed before creating it
- [ ] Confirmed the final branch name and its base to the user
