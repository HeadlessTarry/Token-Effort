---
name: repo-setup
description: Interactive repo setup wizard. Scans repo for missing infrastructure files and offers to create AGENTS.md, recommend plugins, set up triage workflows, issue templates, Dependabot, and a /verify skill.
---

# Repo Setup: Interactive Setup Wizard

## Overview

Presents a 6-step numbered menu; user selects which steps to run. Each step creates or overwrites repo infrastructure files with confirmation prompts. Steps always execute in ascending order (1→6).

| Step | Outcome |
|------|---------|
| 1 | Generates AGENTS.md by delegating to the platform's built-in `/init` command (never writes directly) |
| 2 | Recommends installing the superpowers plugin (non-blocking) |
| 3 | Creates .github/workflows/triaging-gh-issue.yml — a CI workflow that auto-triages new issues |
| 4 | Creates 3 issue templates: feature request, bug report, and config.yml (blank issues disabled) |
| 5 | Delegates entirely to configuring-dependabot |
| 6 | Bootstraps a local `verify` skill at `.opencode/skills/verify/SKILL.md` with user-provided verification commands |

**Usage:** `/repo-setup`

Step 5 (Dependabot) is delegated entirely to `configuring-dependabot`.

## When to Use

**Use when:**
- Setting up a new repository with standard project infrastructure
- Adding one or more standard files to an existing repository

**Do not use when:**
- You only want to configure Dependabot — run `/configuring-dependabot` directly instead

## Prerequisites

- For Step 3: a GitHub App and project board must be configured — see [docs/github-setup.md](https://github.com/HeadlessTarry/Token-Effort/blob/main/docs/github-setup.md)
- For Step 5: the `configuring-dependabot` skill must be installed

## Process

### Phase 1 — Repo scan & menu presentation

Scan the repository using Glob to detect which artefacts already exist:

| Step | File/path to check |
|------|-------------------|
| 1. AGENTS.md | `AGENTS.md` (repo root) |
| 2. Superpowers plugin | Cannot be verified locally — always `[not verified]` |
| 3. Triage workflow | `.github/workflows/triaging-gh-issue.yml` |
| 4. Issue templates | `.github/ISSUE_TEMPLATE/` (any file in this directory) |
| 5. Dependabot | `.github/dependabot.yml` |
| 6. Bootstrap `/verify` skill | `.opencode/skills/verify/SKILL.md` |

Present the following menu, substituting the correct status annotation for each item:

```
Select which setup steps to run (e.g. "1 3 5" or "all"):

1. Generate AGENTS.md                          [<status>]
2. Recommend superpowers plugin                [not verified]
3. Create auto-triage GitHub Actions workflow  [<status>]
4. Create GitHub issue templates               [<status>]
5. Configure Dependabot                        [<status>]
6. Bootstrap `/verify` skill                   [<status>]
```

Status annotations:
- `[not present]` — file/dir does not exist
- `[exists — will overwrite]` — file/dir exists and would be replaced
- `[not verified]` — superpowers plugin only

Wait for the user to reply with space-separated numbers (e.g. `1 3`) or `all`. Parse the reply into a sorted list of step numbers. Always execute steps in ascending order 1→6 regardless of input order. If the input is invalid (e.g. numbers outside 1-6, non-numeric text), print "Please enter valid step numbers (1-6) or 'all'" and re-prompt.

### Phase 2 — Execute selected steps

---
**Step 1 — AGENTS.md**

If `AGENTS.md` exists:

> "`AGENTS.md` already exists. Overwrite? [yes/no]"

Wait for confirmation. If the user says no, note "AGENTS.md: skipped (overwrite declined)" in the summary and move on.

Invoke `/init` via the Skill tool (`skill: "init"`) to generate `AGENTS.md`. Do not write `AGENTS.md` directly or use a hardcoded template — `/init` analyses the project and produces contextual content. If `/init` is not available, inform the user and note "AGENTS.md: skipped (/init not available)" in the summary.

---
**Step 2 — Superpowers plugin**

Print:

> **Strongly recommended: Install the `superpowers` plugin.**
>
> The `superpowers` plugin adds powerful skills for planning, TDD, debugging, and code review.
> Install from the plugin marketplace, or visit: https://github.com/obra/superpowers

Ask:

> "Have you installed the superpowers plugin (or do you already have it)? [yes/no/skip]"

If the user says yes, note "Superpowers plugin: confirmed installed" in the summary.
If the user says no or skips, note "Superpowers plugin: not installed (recommended)" in the summary. Do not block.

---
**Step 3 — Auto-triage GitHub Actions workflow**

Print:

> "Step 3 requires a GitHub App and project board. See [docs/github-setup.md](https://github.com/HeadlessTarry/Token-Effort/blob/main/docs/github-setup.md) for setup instructions."

Ask:

> "Is everything in [docs/github-setup.md](https://github.com/HeadlessTarry/Token-Effort/blob/main/docs/github-setup.md) configured? [yes/no/skip]"

If the user says no or skips, print:

> "Complete the setup in [docs/github-setup.md](https://github.com/HeadlessTarry/Token-Effort/blob/main/docs/github-setup.md), then re-run `/repo-setup` and select Step 3 to continue."

Note "Triage workflow: skipped (prerequisites not met)" in the summary and continue to Step 4.

If `.github/workflows/triaging-gh-issue.yml` exists:

> "`.github/workflows/triaging-gh-issue.yml` already exists. Overwrite? [yes/no]"

Wait for confirmation. If the user says no, note "Triage workflow: skipped (overwrite declined)" in the summary and continue.

**Resolve OpenCode action version**: Before writing the workflow file, resolve the latest release commit SHA:

1. Run `gh api repos/anomalyco/opencode/releases/latest --jq .tag_name` to get the latest release tag (e.g. `v1.15.13`).
2. Run `gh api repos/anomalyco/opencode/commits/tags/<tag> --jq .sha` to resolve that tag to a full commit SHA.

On success, construct the pinned reference as `<sha> # <tag>` (e.g. `385cb694419f98103af0e8fc6187ddcbcbb6eecb # v1.15.13`).

On failure of either command, use the fallback value:

```
385cb694419f98103af0e8fc6187ddcbcbb6eecb # v1.15.13
```

Substitute the resolved (or fallback) reference into the `uses:` line of the workflow template below.

Create directory `.github/workflows/` if it does not exist.

Write `.github/workflows/triaging-gh-issue.yml` with the following OpenCode-format workflow content:

```yaml
name: Triage GitHub Issue

on:
  issues:
    types: [opened]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to triage'
        required: true
        type: number

jobs:
  triage:
    name: Triage
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          persist-credentials: false

      - name: Run skill
        uses: anomalyco/opencode/github@<resolved-reference>
        env:
          OPENCODE_API_KEY: ${{ secrets.OPENCODE_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          model: opencode-go/qwen3.6-plus
          prompt: |
            Use the triaging-gh-issue skill to triage issue ${{ github.event.issue.number || inputs.issue_number }}.
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
assignees: ''

---

## Is your feature request related to a problem? Please describe.

A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

## Describe the solution you'd like

A clear and concise description of what you want to happen.

## Describe alternatives you've considered

A clear and concise description of any alternative solutions or features you've considered.

## Additional context

Add any other context or screenshots about the feature request here.
```

Write `.github/ISSUE_TEMPLATE/02-bug_report.md`:

```markdown
---
name: Bug report
about: Create a report to help us improve
title: ''
assignees: ''

---

## Describe the bug

A clear and concise description of what the bug is.

## To Reproduce

Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected behavior

A clear and concise description of what you expected to happen.

## Screenshots

If applicable, add screenshots to help explain your problem.

## Additional context

Add any other context about the problem here.
```

Write `.github/ISSUE_TEMPLATE/config.yml`:

```yaml
---
blank_issues_enabled: false
```

---
**Step 5 — Dependabot config**

Invoke: `configuring-dependabot`

Do not perform any Dependabot logic directly. The sub-skill handles all scanning, overwrite detection, and file writing.

---
**Step 6 — Bootstrap `/verify` skill**

Check if `.opencode/skills/verify/SKILL.md` already exists.

If it exists:

> "`/verify` skill already exists — skipping."

Note "`/verify`: skipped (already exists)" in the summary and continue.

Otherwise, ask:

> "What commands should be run to verify this project is working correctly? List them in the order they should run."

If the user says they don't know yet or wants to skip:

> "`/verify` not configured — run `/repo-setup` again when you're ready to set this up."

Note "`/verify`: skipped (no commands provided)" in the summary and continue.

Otherwise, confirm the list back to the user:

> "I'll configure `/verify` with these commands in order:
> 1. `<command 1>`
> 2. `<command 2>`
> ...
> Is that correct? [yes/no]"

Wait for confirmation. If the user says no, re-ask for the command list.

Create directory `.opencode/skills/verify/` if it does not exist.

Write `.opencode/skills/verify/SKILL.md`, substituting the confirmed commands for `<command N>`:

```markdown
---
name: verify
description: Use when asked to verify changes, run all checks, confirm everything
  is working, run tests, or check nothing is broken before committing
---

# Verify

Run all project checks to confirm changes are working correctly.

## Commands

Run each of the following commands. Report the result of each (pass/fail and any output).
If any command fails, stop and report the failure. Do not run any remaining commands.

1. `<command 1>`
2. `<command 2>`
<!-- repeat for each additional command -->
```

Note "`/verify`: created" in the summary.

### Phase 3 — Completion summary

Print a summary of all selected steps:

```
✅ Done. Here's what was set up:
- AGENTS.md: created
- Superpowers plugin: confirmed installed
- Triage workflow: created
- Issue templates: created
- Dependabot: delegated to /configuring-dependabot
- /verify: created
```

Adjust each line to reflect the actual outcome (e.g. "created", "skipped (overwrite declined)", "skipped (prerequisites not met)", "not installed (recommended)"). Include only the steps the user selected — omit unselected steps from the summary entirely.

No git commit is made. The user decides what to commit.

## Common Mistakes

- **Skipping overwrite checks** — always warn and ask before writing any file that already exists.
- **Executing steps not selected by the user** — only run the steps the user chose.
- **Executing steps out of order** — always run in order 1→6 regardless of user input order.
- **Blocking on Step 3 prerequisites** — if the user says prerequisites are not set up, note it in the summary and continue. Do not halt.
- **Blocking on Step 2 "no"** — if the user says the superpowers plugin is not installed, note it and continue. Do not halt.
- **Performing Dependabot logic directly in Step 5** — always delegate to `configuring-dependabot`. Do not scan ecosystems or write `dependabot.yml` yourself.
- **Writing `AGENTS.md` directly in Step 1** — always delegate to `/init` via the Skill tool. Do not write the file directly or use a hardcoded template.
- **Omitting skipped steps from the summary** — every selected step must appear in the summary, even if skipped or declined.
- **Writing `/verify` when it already exists** — always check for `.opencode/skills/verify/SKILL.md` first. If it exists, skip with the log message and do not overwrite.
- **Not confirming commands before writing** — always echo the command list back to the user and wait for a yes confirmation before writing `.opencode/skills/verify/SKILL.md`.
- **Writing the file when the user skips** — if the user says they don't know or wants to skip, do not generate any file. Log the "not configured" message and move on.
- **Making a git commit after setup** — no git commit is made. The user decides what to commit.
- **Hardcoding `@main` in Step 3** — the skill must resolve the OpenCode action version dynamically via `gh api` before writing the workflow file. Never hardcode `@main` or any unpinned branch reference.

## Eval

- [ ] Scanned repo for all six artefacts before presenting menu
- [ ] Presented menu with correct status annotations (`[not present]`, `[exists — will overwrite]`, `[not verified]`)
- [ ] Waited for user selection before executing any steps
- [ ] Parsed "all" as selecting all six steps
- [ ] Executed only the selected steps
- [ ] Executed steps in order 1→6 regardless of input order
- [ ] Step 1: Warned and confirmed before overwriting `AGENTS.md`
- [ ] Step 1: Invoked `/init` via Skill tool to generate `AGENTS.md`
- [ ] Step 1: Did not write `AGENTS.md` directly or use a hardcoded template
- [ ] Step 2: Printed superpowers install recommendation with GitHub URL
- [ ] Step 2: Asked if installed; did not block on "no" or "skip"
- [ ] Step 3: Referenced docs/github-setup.md for prerequisites
- [ ] Step 3: Asked if prerequisites set up; skipped workflow on "no"/"skip"
- [ ] Step 3: Warned and confirmed before overwriting existing workflow file
- [ ] Step 3: Resolves the OpenCode action SHA via `gh api` before writing the workflow file
- [ ] Step 4: Warned and confirmed before overwriting any existing template files
- [ ] Step 4: Wrote all three template files with correct content
- [ ] Step 5: Delegated to `configuring-dependabot` via Skill tool
- [ ] Step 5: Did not perform any Dependabot logic directly
- [ ] Step 6: Checked for existing `.opencode/skills/verify/SKILL.md` before proceeding
- [ ] Step 6: Skipped with log message when `/verify` already exists; did not overwrite
- [ ] Step 6: Asked for verification commands when skill not present
- [ ] Step 6: Confirmed command list with user before writing
- [ ] Step 6: Did not write file when user skipped; logged "not configured" message
- [ ] Step 6: Wrote `.opencode/skills/verify/SKILL.md` with correct frontmatter, description, ordered command list, and stop-on-failure instruction
- [ ] Step 6: Noted outcome in completion summary
- [ ] Printed completion summary covering every selected step with accurate outcomes
- [ ] Made no git commit
