# ⚙️ GitHub Setup Guide

This guide covers the GitHub infrastructure required to use the Matt Pocock (MP) skills ecosystem with Token-Effort. The workflow uses label-based state tracking and conversational triage — no project board required.

**Audience:** Project maintainers, contributors, and external users who want to use these skills on their own GitHub repositories.

---

## ✅ Prerequisites Checklist

Use this checklist to see what you still need to set up. Each item links to the detailed section below.

- [ ] [GitHub repository](#1-github-repository) with Issues enabled
- [ ] [Issue labels](#2-issue-labels): MP triage labels + category labels
- [ ] [Repository secret](#3-repository-secrets): `OPENCODE_API_KEY` (for AI-powered workflows)

---

## 📋 1. GitHub Repository

Ensure your repository has GitHub Issues enabled:

1. Navigate to your repository on GitHub.
2. Go to **Settings** → **General** → **Features**.
3. Ensure **Issues** is checked.

That's it! No project board is needed — MP's workflow uses labels for state tracking.

---

## 🏷️ 2. Issue Labels

The MP ecosystem uses two categories of labels:

### Triage Labels (State Tracking)

These labels track the issue through the triage workflow:

| Label | Description | Color |
|-------|-------------|-------|
| `needs-triage` | New issue, awaiting triage | `#f9d0c4` |
| `needs-info` | More information needed from reporter | `#fef2c0` |
| `ready-for-agent` | Triage complete, ready for AI agent to work on | `#c5def5` |
| `ready-for-human` | Ready for human implementation | `#d4c5f9` |
| `wontfix` | Will not be fixed (out of scope, won't implement) | `#eeeeee` |

### Category Labels (Issue Type)

These labels categorize the issue by type:

| Label | Description | Color |
|-------|-------------|-------|
| `enhancement` | New feature or request | `#a2eeef` |
| `bug` | Something isn't working | `#d73a4a` |
| `documentation` | Improvements or additions to documentation | `#0075ca` |
| `duplicate` | This issue or pull request already exists | `#cfd3d7` |

### Creating Labels

Run the following commands to create all labels:

```bash
# Check what labels already exist to avoid duplicates
gh label list

# Create triage labels
gh label create "needs-triage"     --color "#f9d0c4" --description "New issue, awaiting triage"
gh label create "needs-info"       --color "#fef2c0" --description "More information needed from reporter"
gh label create "ready-for-agent"  --color "#c5def5" --description "Triage complete, ready for AI agent"
gh label create "ready-for-human"  --color "#d4c5f9" --description "Ready for human implementation"
gh label create "wontfix"          --color "#eeeeee" --description "This will not be worked on"

# Create category labels (skip if they already exist)
gh label create "enhancement"      --color "#a2eeef" --description "New feature or request"
gh label create "bug"              --color "#d73a4a" --description "Something isn't working"
gh label create "documentation"    --color "#0075ca" --description "Improvements or additions to documentation"
gh label create "duplicate"        --color "#cfd3d7" --description "This issue or pull request already exists"
```

Alternatively, you can create labels via **Settings** → **Labels** in the GitHub UI.

> **Note:** GitHub creates several default labels (`bug`, `documentation`, `duplicate`, `enhancement`) when a repository is initialized. Run `gh label list` first and skip `gh label create` for any that already exist.

---

## 🔐 3. Repository Secrets

If you plan to use AI-powered workflows (like automated triage), add the following secret under **Settings** → **Secrets and variables** → **Actions** → **Secrets**.

| Secret | Value |
|--------|-------|
| `OPENCODE_API_KEY` | Your API key — generated during setup. See your OpenCode documentation for key generation. |

> **Note:** The workflow uses `${{ secrets.GITHUB_TOKEN }}` automatically — no additional token configuration is needed.

---

## 🔄 The Triage Workflow

MP's triage workflow is **conversational** — you run `/triage` on an issue when you're ready, rather than having an automated workflow run on every new issue.

### How to Triage an Issue

1. A new issue is opened (it will have the `needs-triage` label if you've set up issue templates correctly).
2. When you're ready, run `/triage` in your AI assistant.
3. The skill will:
   - Read the issue and categorize it (enhancement, bug, documentation)
   - Detect duplicates by searching for similar issues
   - Ask clarifying questions if needed (adds `needs-info` label)
   - Mark the issue as `ready-for-agent` or `ready-for-human` based on complexity
   - Mark as `wontfix` if it's out of scope

### Label State Machine

Issues move through labels as they're triaged:

```
needs-triage → needs-info (if clarification needed)
            → ready-for-agent (if AI can handle it)
            → ready-for-human (if human implementation needed)
            → wontfix (if out of scope)
```

---

## 📝 Issue Templates

Issue templates help ensure new issues have the right information and labels from the start. Token-Effort provides templates at `.github/ISSUE_TEMPLATE/`:

- `01-feature_request.md` — automatically applies the `enhancement` label
- `02-bug_report.md` — automatically applies the `bug` label
- `config.yml` — disables blank issues to encourage using templates

To set up issue templates, run `/repo-setup` and follow the prompts.

---

## ✔️ Verification

After completing all steps above, run the following to confirm everything is in place:

```bash
# Confirm all labels exist
gh label list

# Expected labels:
# - needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix
# - enhancement, bug, documentation, duplicate

# Confirm Issues are enabled
gh repo view --json hasIssuesEnabled
```

---

## 🚫 Out of Scope

This guide does not cover:

- Installing the MP skills — run `npx skills add mattpocock/skills`
- Installing Token-Effort skills — run `npx skills add HeadlessTarry/Token-Effort`
- Configuring the platform itself (model settings, permissions)
- Running `/repo-setup` for complete onboarding — this handles templates, Dependabot, and more
