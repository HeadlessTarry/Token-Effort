# ⚙️ GitHub Setup Guide

This guide covers the GitHub infrastructure required to use the skills and agents. The full workflow — triaging issues, brainstorming specs, building features, and cutting releases — depends on this foundation. It does **not** cover platform configuration, plugin installation, or the release pipeline — only the GitHub-side setup.

**Audience:** Project maintainers, contributors, and external users who want to use these skills on their own GitHub repositories.

---

## ✅ Prerequisites Checklist

Use this checklist to see what you still need to set up. Each item links to the detailed section below.

- [ ] [GitHub organisation](#1-github-organisation) (or personal account)
- [ ] [GitHub Project board](#3-github-project-board) with Status field: `New` → `Brainstorming` → `Building` → `Done`
- [ ] [Project board linked to the repository](#3-github-project-board) (Settings → Linked repositories)
- [ ] [Issue labels](#4-issue-labels): `enhancement`, `bug`, `documentation`, `duplicate`, `pending-review`
- [ ] [Repository secret](#5-repository-secrets--variables): `OPENCODE_API_KEY`
- [ ] [Triage workflow](#6-triage-workflow) added to `.github/workflows/`

---

## 📋 2. GitHub Project Board

The project board tracks issue status through the workflow lifecycle. The triage skill reads and writes the `Status` field to move issues between columns automatically.

**Steps:**

1. Navigate to your organisation's **Projects** tab → **New project**.
2. Choose **Board** or **Table** layout (either works).
3. Link the project to your repository:
   - Open the project → **Settings** → **Linked repositories** → add your repo.
4. Add a single-select field named exactly **`Status`** with options in this exact order:
    - `New`
    - `Brainstorming`
    - `Building`
    - `Done`

> **Important:** The field must be named exactly `Status` (case-sensitive). The `move-issue-status` skill searches for this field by name.

---

## 🏷️ 3. Issue Labels

These labels are used by the triage skill to classify issues by type. Run the following commands against your repository to create them:

```bash
# Check what labels already exist to avoid duplicates with GitHub defaults
gh label list

# Create the required labels
gh label create "enhancement"    --color "#a2eeef" --description "New feature or request"
gh label create "bug"            --color "#d73a4a" --description "Something isn't working"
gh label create "documentation"  --color "#0075ca" --description "Improvements or additions to documentation"
gh label create "duplicate"      --color "#cfd3d7" --description "This issue or pull request already exists"
gh label create "pending-review" --color "#FEF2C0" --description "Spec posted, awaiting human approval"
```

Alternatively, you can create labels via **Settings** → **Labels** in the GitHub UI.

> **Note:** GitHub creates several default labels (e.g. `bug`, `documentation`, `duplicate`, `enhancement`) when a repository is initialised. Run `gh label list` first and skip `gh label create` for any that already exist.

---

## 🔐 4. Repository Secrets & Variables

The triage workflow uses one repository secret. Add it under **Settings** → **Secrets and variables** → **Actions** → **Secrets**.

### Secrets (Secrets tab)

| Secret | Value |
|--------|-------|
| `OPENCODE_API_KEY` | Your API key — generated during setup. See your OpenCode documentation for key generation. |

> **Note:** The workflow uses `${{ secrets.GITHUB_TOKEN }}` automatically — no additional token configuration is needed.

---

## ⚙️ 5. Triage Workflow

The triage workflow runs when a new issue is opened and can also be triggered manually. It invokes the `triaging-gh-issue` skill, which labels issues by type, detects duplicates, and advances issue statuses on the project board.

**Steps:**

1. Add the workflow file to `.github/workflows/triaging-gh-issue.yml` in your repository. The workflow uses the `anomalyco/opencode/github` action with `OPENCODE_API_KEY` and `GITHUB_TOKEN` secrets.

2. The workflow triggers automatically on new issues (`issues: types: [opened]`) and supports manual triggering via `workflow_dispatch` with an `issue_number` input.

---

## ✔️ Verification

After completing all steps above, run the following to confirm everything is in place:

```bash
# Confirm all 5 required labels exist
gh label list

# Confirm the project board is visible
gh project list --owner <your-org>

# Trigger the triage workflow manually (run from inside a cloned copy of your repo,
# or pass --repo explicitly)
gh workflow run triaging-gh-issue.yml --repo <your-org>/<your-repo>
```

---

## 🚫 Out of Scope

This guide does not cover:

- Installing the plugin
- Configuring the platform itself (model settings, permissions)
- Setting up the Release Manager GitHub App
- Creating issue templates — not required for triage to run, but recommended. This repository's templates at [`.github/ISSUE_TEMPLATE/`](https://github.com/HeadlessTarry/Token-Effort/tree/main/.github/ISSUE_TEMPLATE) can be used as a starting point.
