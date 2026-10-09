# ⚙️ GitHub Setup

Token-Effort's home-grown skills (under [skills](../skills)) and the installed skill sets work through GitHub Issues and the `gh` CLI. This page lists what a repository needs before those skills work well in it.

Install the skills first with `./install.sh` (see the [README](../README.md)).

---

## ✅ Checklist

- [ ] [`gh` CLI](#1-gh-cli) authenticated
- [ ] [Issues](#2-issues-enabled) enabled on the repository
- [ ] [Issue labels](#3-issue-labels) created
- [ ] [Issue templates](#4-issue-templates) in place
- [ ] [Triage labels and tracker config](#5-triage-labels-and-tracker-config) set up

---

## 1. `gh` CLI

Install the [GitHub CLI](https://cli.github.com/) and run `gh auth login`. The skills file issues with `gh issue create` and never use MCP tools.

## 2. Issues enabled

In the repository, go to **Settings** → **General** → **Features** and tick **Issues**.

## 3. Issue labels

`propose-feature` and `report-bug` rely on the labels their issue templates apply:

| Label | Description | Color |
|-------|-------------|-------|
| `enhancement` | New feature or request | `#a2eeef` |
| `bug` | Something isn't working | `#d73a4a` |
| `documentation` | Improvements or additions to documentation | `#0075ca` |
| `duplicate` | This issue or pull request already exists | `#cfd3d7` |

GitHub creates these by default on new repositories. Check with `gh label list` and create any that are missing:

```bash
gh label create "enhancement"   --color "#a2eeef" --description "New feature or request"
gh label create "bug"           --color "#d73a4a" --description "Something isn't working"
gh label create "documentation" --color "#0075ca" --description "Improvements or additions to documentation"
gh label create "duplicate"     --color "#cfd3d7" --description "This issue or pull request already exists"
```

## 4. Issue templates

The skills find templates in `.github/ISSUE_TEMPLATE/` by their `labels:` frontmatter, not by filename, and fall back to a plain format when none match. This repository's templates are the reference:

- `01-feature_request.md` applies `enhancement`
- `02-bug_report.md` applies `bug`
- `config.yml` disables blank issues

Copy them into a repository to use them there.

## 5. Triage labels and tracker config

`install.sh` installs the issue-tracker and triage-label docs (the five labels `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) once per user, from [`config/docs/agents/`](../config/docs/agents/). Repos do not carry their own copies. In each repository, run `/setup-matt-pocock-skills` and accept only the domain docs.

With the `pstack` skill set, run `/create-verification-skill` once per repository.

---

## ✔️ Verification

```bash
gh auth status
gh label list                                   # enhancement, bug, documentation, duplicate
gh repo view --json hasIssuesEnabled
```
