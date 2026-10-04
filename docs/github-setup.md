# ⚙️ GitHub Setup Guide

This guide covers the GitHub infrastructure required to use Token-Effort skills. 

**Audience:** Project maintainers, contributors, and external users who want to use these skills on their own GitHub repositories.

---

## ✅ Prerequisites Checklist

Use this checklist to see what you still need to set up. Each item links to the detailed section below.

- [ ] [GitHub repository](#1-github-repository) with Issues enabled
- [ ] [Issue labels](#2-issue-labels): Category labels for issue types

---

## 📋 1. GitHub Repository

Ensure your repository has GitHub Issues enabled:

1. Navigate to your repository on GitHub.
2. Go to **Settings** → **General** → **Features**.
3. Ensure **Issues** is checked.

---

## 🏷️ 2. Issue Labels

Token-Effort uses category labels to organize issues by type:

| Label | Description | Color |
|-------|-------------|-------|
| `enhancement` | New feature or request | `#a2eeef` |
| `bug` | Something isn't working | `#d73a4a` |
| `documentation` | Improvements or additions to documentation | `#0075ca` |
| `duplicate` | This issue or pull request already exists | `#cfd3d7` |

### Creating Labels

Run the following commands to create these labels:

```bash
# Check what labels already exist to avoid duplicates
gh label list

# Create category labels (skip if they already exist)
gh label create "enhancement"      --color "#a2eeef" --description "New feature or request"
gh label create "bug"              --color "#d73a4a" --description "Something isn't working"
gh label create "documentation"    --color "#0075ca" --description "Improvements or additions to documentation"
gh label create "duplicate"        --color "#cfd3d7" --description "This issue or pull request already exists"
```

Alternatively, you can create labels via **Settings** → **Labels** in the GitHub UI.

> **Note:** GitHub creates several default labels (`bug`, `documentation`, `duplicate`, `enhancement`) when a repository is initialized. Run `gh label list` first and skip `gh label create` for any that already exist.

---

## 🔄 Issue Workflow

Issues are labeled by type when created (via templates) and can be further categorized as needed. Token-Effort skills work with GitHub Issues directly — no project board or special workflow required.

---

## 📝 Issue Templates

Issue templates help ensure new issues have the right information and labels from the start. Token-Effort provides templates at `.github/ISSUE_TEMPLATE/`:

- `01-feature_request.md` — automatically applies the `enhancement` label
- `02-bug_report.md` — automatically applies the `bug` label
- `config.yml` — disables blank issues to encourage using templates

Copy these templates from the Token-Effort repository into your own `.github/ISSUE_TEMPLATE/`.

---

## ✔️ Verification

After completing all steps above, run the following to confirm everything is in place:

```bash
# Confirm all labels exist
gh label list

# Expected labels:
# - enhancement, bug, documentation, duplicate

# Confirm Issues are enabled
gh repo view --json hasIssuesEnabled
```

---

## 🚫 Out of Scope

This guide does not cover:

- Installing Token-Effort skills — run `./install.sh` from the Token-Effort repository
- Configuring the platform itself (model settings, permissions)
- Configuring Dependabot — run `/configuring-dependabot`
