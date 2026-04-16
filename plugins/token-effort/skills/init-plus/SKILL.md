---
name: init-plus
description: Interactive repo setup wizard. Offers to create CLAUDE.md, recommend the superpowers plugin, create an auto-triage GitHub Actions workflow, create GitHub issue templates, and configure Dependabot. Use when setting up a new or existing repository.
user-invocable: true
---

# Init Plus

## Overview

Presents a numbered menu of five repo setup steps. The user selects which steps to run (by number or "all"), and the skill executes them in fixed order 1→5. Each step handles overwrite detection and asks before replacing existing files.

**Usage:** `/token-effort:init-plus`

Step 5 (Dependabot) is delegated entirely to `token-effort:configuring-dependabot`.

## When to Use

**Use when:**
- Setting up a new repository with standard project infrastructure
- Adding one or more standard files to an existing repository

**Do not use when:**
- You only want to configure Dependabot — run `/token-effort:configuring-dependabot` directly instead

## Prerequisites

- For Step 3: a GitHub App and project board must be configured — see `docs/github-setup.md`
- For Step 5: the `token-effort:configuring-dependabot` skill must be installed

## Process

### Phase 1 — Repo scan & menu presentation

Scan the repository using Glob to detect which artefacts already exist:

| Step | File/path to check |
|---|---|
| 1. CLAUDE.md | `CLAUDE.md` (repo root) |
| 2. Superpowers plugin | Cannot be verified locally — always show `[not verified]` |
| 3. Triage workflow | `.github/workflows/triaging-gh-issues.yml` |
| 4. Issue templates | `.github/ISSUE_TEMPLATE/` (any file in this directory) |
| 5. Dependabot | `.github/dependabot.yml` |

Present the following menu, substituting the correct status annotation for each item:

```
Select which setup steps to run (e.g. "1 3 5" or "all"):

1. Generate CLAUDE.md                         [<status>]
2. Recommend superpowers plugin               [not verified]
3. Create auto-triage GitHub Actions workflow [<status>]
4. Create GitHub issue templates              [<status>]
5. Configure Dependabot                       [<status>]
```

Status annotations:
- `[not present]` — file/dir does not exist
- `[exists — will overwrite]` — file/dir exists and would be replaced
- `[not verified]` — superpowers plugin only

Wait for the user to reply with space-separated numbers (e.g. `1 3`) or `all`. Parse the reply into a sorted list of step numbers. Always execute steps in ascending order 1→5 regardless of input order.

### Phase 2 — Execute selected steps

Execute only the steps the user selected, in order.

---

**Step 1 — CLAUDE.md**

If `CLAUDE.md` exists:

> "`CLAUDE.md` already exists. Overwrite? [yes/no]"

Wait for confirmation. If the user says no, note "CLAUDE.md: skipped (overwrite declined)" in the summary and move on.

Invoke `/init` via the Skill tool (`skill: "init"`) to generate `CLAUDE.md`. Do not write `CLAUDE.md` directly or use a hardcoded template — `/init` analyses the project and produces contextual content.

---

**Step 2 — Superpowers plugin**

Print:

> **Strongly recommended: Install the `superpowers` Claude plugin.**
>
> The `superpowers` plugin adds powerful skills for planning, TDD, debugging, and code review.
>
> Install from the Claude Code plugin marketplace, or visit: https://github.com/obra/superpowers

Ask:

> "Have you installed the superpowers plugin (or do you already have it)? [yes/no/skip]"

If the user says yes, note "Superpowers plugin: confirmed installed" in the summary.
If the user says no or skips, note "Superpowers plugin: not installed (recommended)" in the summary. Do not block.

---

**Step 3 — Auto-triage GitHub Actions workflow**

Print:

> "Step 3 requires a GitHub App and project board. See `docs/github-setup.md` for setup instructions."

Ask:

> "Is everything in `docs/github-setup.md` configured? [yes/no/skip]"

If the user says no or skips, note "Triage workflow: skipped (prerequisites not met)" in the summary and continue to Step 4.

If `.github/workflows/triaging-gh-issues.yml` exists:

> "`.github/workflows/triaging-gh-issues.yml` already exists. Overwrite? [yes/no]"

Wait for confirmation. If the user says no, note "Triage workflow: skipped (overwrite declined)" in the summary and continue.

Create directory `.github/workflows/` if it does not exist.

Write `.github/workflows/triaging-gh-issues.yml`:

```yaml
name: Triage GitHub Issues

on:
  schedule:
    - cron: '0 4 * * 1'
  workflow_dispatch:

jobs:
  triage:
    name: 🔍 Triage
    runs-on: ubuntu-latest
    permissions:
      issues: write
      id-token: write
    steps:
      - name: 🔑 Authenticate as Project Manager
        id: project-manager-token
        uses: actions/create-github-app-token@v3
        with:
          client-id: ${{ vars.PROJECT_MANAGER_CLIENT_ID }}
          private-key: ${{ secrets.PROJECT_MANAGER_PRIVATE_KEY }}
          # Obtain a token with access to the owner-level resources (i.e. GH projects)
          owner: ${{ github.repository_owner }}

      - name: ✨ Run skill
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          github_token: ${{ steps.project-manager-token.outputs.token }}
          # Always references the Token-Effort plugin source — correct even when deploying to other repos
          plugin_marketplaces: https://github.com/HeadlessTarry/Token-Effort.git
          plugins: token-effort
          prompt: |
            Use the `token-effort:triaging-gh-issues` skill with `--advance-status`.
            Triage all open issues in this repository.

            Upon completion, write a brief markdown summary of your activity to the GitHub Actions step summary using: SUMMARY_FILE=$(printenv GITHUB_STEP_SUMMARY) && echo "**[Claude]** {Activity summary}" >> "$SUMMARY_FILE"
          claude_args: >-
            --model sonnet
            --allowedTools Skill,Bash(printenv *),Bash(git remote get-url *),Bash(gh issue list *),Bash(gh issue view *),Bash(gh search issues *),Bash(gh issue edit *),Bash(gh issue comment *),Bash(gh project list *),Bash(gh project item-list *),Bash(gh project field-list *),Bash(gh project item-edit *)
```

---

**Step 4 — GitHub issue templates**

Check if any of the following files exist:
- `.github/ISSUE_TEMPLATE/01-feature_request.md`
- `.github/ISSUE_TEMPLATE/02-bug_report.md`
- `.github/ISSUE_TEMPLATE/config.yml`

If any exist:

> "One or more issue template files already exist. Overwrite all? [yes/no]"

Wait for confirmation. If the user says no, note "Issue templates: skipped (overwrite declined)" in the summary and continue.

Create directory `.github/ISSUE_TEMPLATE/` if it does not exist.

Write `.github/ISSUE_TEMPLATE/01-feature_request.md`:

```markdown
---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: enhancement
assignees: ''

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

Write `.github/ISSUE_TEMPLATE/02-bug_report.md`:

```markdown
---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Additional context**
Add any other context about the problem here.
```

Write `.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
```

---

**Step 5 — Dependabot config**

Invoke: `token-effort:configuring-dependabot`

Do not perform any Dependabot logic directly. The sub-skill handles all scanning, overwrite detection, and file writing.

---

### Phase 3 — Completion summary

Print a summary of all selected steps:

```
✅ Done. Here's what was set up:
- CLAUDE.md: created
- Superpowers plugin: confirmed installed
- Triage workflow: created
- Issue templates: created
- Dependabot: delegated to /configuring-dependabot
```

Adjust each line to reflect the actual outcome (e.g. "created", "skipped (overwrite declined)", "skipped (prerequisites not met)", "not installed (recommended)"). Include only the steps the user selected — omit unselected steps from the summary entirely.

No git commit is made. The user decides what to commit.

## Common Mistakes

- **Skipping overwrite checks** — always warn and ask before writing any file that already exists.
- **Executing steps not selected by the user** — only run the steps the user chose.
- **Executing steps out of order** — always run in order 1→5 regardless of user input order.
- **Blocking on Step 3 prerequisites** — if the user says prerequisites are not set up, note it in the summary and continue. Do not halt the skill.
- **Blocking on Step 2 "no"** — if the user says the superpowers plugin is not installed, note it and continue. Do not halt.
- **Performing Dependabot logic directly in Step 5** — always delegate to `token-effort:configuring-dependabot`. Do not scan ecosystems or write `dependabot.yml` yourself.
- **Writing `CLAUDE.md` directly in Step 1** — always delegate to `/init` via the Skill tool. Do not write the file directly or use a hardcoded template.
- **Omitting skipped steps from the summary** — every selected step must appear in the summary, even if skipped or declined.

## Eval

- [ ] Scanned repo for all five artefacts before presenting menu
- [ ] Presented menu with correct status annotations (`[not present]`, `[exists — will overwrite]`, `[not verified]`)
- [ ] Waited for user selection before executing any steps
- [ ] Parsed "all" as selecting all five steps
- [ ] Executed only the selected steps
- [ ] Executed steps in order 1→5 regardless of input order
- [ ] Step 1: Warned and confirmed before overwriting `CLAUDE.md`
- [ ] Step 1: Invoked `/init` via Skill tool to generate `CLAUDE.md`
- [ ] Step 1: Did not write `CLAUDE.md` directly or use a hardcoded template
- [ ] Step 2: Printed superpowers install recommendation with GitHub URL
- [ ] Step 2: Asked if installed; did not block on "no" or "skip"
- [ ] Step 3: Referenced `docs/github-setup.md` for prerequisites
- [ ] Step 3: Asked if prerequisites set up; skipped workflow on "no"/"skip"
- [ ] Step 3: Warned and confirmed before overwriting existing workflow file
- [ ] Step 3: Wrote workflow with exact content matching the template above
- [ ] Step 4: Warned and confirmed before overwriting any existing template files
- [ ] Step 4: Wrote all three template files with correct content
- [ ] Step 5: Delegated to `token-effort:configuring-dependabot` via Skill tool
- [ ] Step 5: Did not perform any Dependabot logic directly
- [ ] Printed completion summary covering every selected step with accurate outcomes
- [ ] Made no git commit
