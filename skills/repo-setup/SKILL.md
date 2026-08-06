---
name: repo-setup
description: Interactive onboarding skill for the Matt Pocock skills ecosystem. Guides users through fresh-repo bootstrap or migration from Superpowers, installing skills, configuring labels, and setting up issue templates.
---

# Repo Setup: MP Ecosystem Onboarding

## Overview

Interactive onboarding skill that guides users through setting up their repository for the Matt Pocock (MP) skills ecosystem. Presents an explicit choice at the start: fresh-repo bootstrap or migration from an existing setup.

**Usage:** `/repo-setup`

## When to Use

**Use when:**
- Setting up a new repository with MP skills
- Migrating an existing repository from Superpowers to MP skills
- Onboarding a repository to the Token-Effort complementary skill pack

**Do not use when:**
- You only want to configure Dependabot — run `/configuring-dependabot` directly instead
- You want to set up MP's issue tracker and labels — run `/setup-matt-pocock-skills` directly instead

## Process

### Phase 1 — Determine Setup Type

Ask the user:

> "Is this a fresh repository, or an existing repository you're migrating?"

Wait for the user to respond with either "fresh" or "migrating" (or similar). Based on their response, proceed to either the Fresh Repo Bootstrap flow or the Migration flow.

If the response is unclear, ask for clarification before proceeding.

---

### Fresh Repo Bootstrap Flow

This flow sets up a new repository from scratch with MP skills and Token-Effort.

#### Step 1 — Install MP Skills

Print:

> **Step 1: Install Matt Pocock's skills**
>
> Run the following command to install the MP skills ecosystem:
>
> ```bash
> npx skills add mattpocock/skills
> ```
>
> This will install the core skills including `/triage`, `/implement`, `/code-review`, and others.

Ask:

> "Have you installed the MP skills? [yes/no]"

If the user says no, wait for them to complete the installation before proceeding.

---

#### Step 2 — Install Token-Effort Skills

Print:

> **Step 2: Install Token-Effort skills**
>
> Run the following command to install the Token-Effort complementary skill pack:
>
> ```bash
> npx skills add HeadlessTarry/Token-Effort
> ```
>
> This will install 4 skills:
> - `/repo-setup` (this skill)
> - `/propose-feature` — guides feature proposals
> - `/report-bug` — guides bug reports
> - `/configuring-dependabot` — configures Dependabot

Ask:

> "Have you installed the Token-Effort skills? [yes/no]"

If the user says no, wait for them to complete the installation before proceeding.

---

#### Step 3 — Recommend /setup-matt-pocock-skills

Print:

> **Step 3: Configure MP skills for your repo (recommended)**
>
> Run `/setup-matt-pocock-skills` to configure:
> - Issue tracker setup (GitHub Issues)
> - Triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)
> - Domain doc layout (`CONTEXT.md` and `docs/adr/`)
>
> This step is recommended but optional. You can run it later if you prefer.

Ask:

> "Would you like to run `/setup-matt-pocock-skills` now? [yes/no/skip]"

If the user says yes, print:

> "Run `/setup-matt-pocock-skills` in your AI assistant to configure your issue tracker, labels, and domain docs."

Note "MP skills configuration: user will run separately" and continue.
If the user says no or skips, note "MP skills configuration: skipped (user declined)" and continue.

---

#### Step 4 — Create Issue Templates

Check if any of the following files exist:
- `.github/ISSUE_TEMPLATE/01-feature_request.md`
- `.github/ISSUE_TEMPLATE/02-bug_report.md`
- `.github/ISSUE_TEMPLATE/config.yml`

If any exist:

> "One or more issue template files already exist. Overwrite all? [yes/no]"

Wait for confirmation. If the user says no, note "Issue templates: skipped (overwrite declined)" and continue.

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
labels: bug
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

Note "Issue templates: created" and continue.

---

#### Step 5 — Configure Dependabot

Check if `.github/dependabot.yml` exists.

If it exists:

> "`.github/dependabot.yml` already exists. Overwrite? [yes/no]"

Wait for confirmation. If the user says no, note "Dependabot: skipped (overwrite declined)" and continue.

Invoke: `/configuring-dependabot` via the Skill tool.

Do not perform any Dependabot logic directly. The sub-skill handles all scanning, overwrite detection, and file writing.

---

#### Step 6 — Verification

Print:

> **Step 6: Verification**
>
> Your repository is now set up with:
> - MP skills ecosystem (from `mattpocock/skills`)
> - Token-Effort complementary skills (from `HeadlessTarry/Token-Effort`)
> - Issue templates for feature requests and bug reports
> - Dependabot configuration (if configured)
>
> **Next steps:**
> - Run `/setup-matt-pocock-skills` if you haven't already (configures labels and domain docs)
> - Start using the skills! Try `/triage` on an issue, or `/implement` on a feature.

Note "Verification: complete" and proceed to the completion summary.

---

### Migration Flow

This flow migrates an existing repository from Superpowers to MP skills.

#### Step 1 — Detect Superpowers Artifacts

Scan the repository for Superpowers artifacts:

| Artifact | Path to check |
|----------|---------------|
| Superpowers config | `.superpowers/` |
| Superpowers docs | `docs/superpowers/` |
| Old decisions dir | `docs/decisions/` |
| Install scripts | `install.ps1`, `install.sh` |
| Vendor config | `vendor.json` |
| Lib helpers | `lib/` |
| Triaging workflow | `.github/workflows/triaging-gh-issue.yml` |

Print a report:

> **Migration Analysis**
>
> I've scanned your repository for Superpowers artifacts:
>
> - `.superpowers/`: [present/not found]
> - `docs/superpowers/`: [present/not found]
> - `docs/decisions/`: [present/not found]
> - Install scripts: [present/not found]
> - `vendor.json`: [present/not found]
> - `lib/`: [present/not found]
> - Triaging workflow: [present/not found]

Continue to Step 2 regardless of what was found.

---

#### Step 2 — Install MP Skills

Print:

> **Step 2: Install Matt Pocock's skills**
>
> Run the following command to install the MP skills ecosystem:
>
> ```bash
> npx skills add mattpocock/skills
> ```

Ask:

> "Have you installed the MP skills? [yes/no]"

If the user says no, wait for them to complete the installation before proceeding.

---

#### Step 3 — Install Token-Effort Skills

Print:

> **Step 3: Install Token-Effort skills**
>
> Run the following command to install the Token-Effort complementary skill pack:
>
> ```bash
> npx skills add HeadlessTarry/Token-Effort
> ```

Ask:

> "Have you installed the Token-Effort skills? [yes/no]"

If the user says no, wait for them to complete the installation before proceeding.

---

#### Step 4 — Migrate ADRs

Check if `docs/decisions/` exists.

If it exists:

> "I found `docs/decisions/` with architectural decision records. I'll migrate them to `docs/adr/` to align with MP conventions."

Check if `docs/adr/` exists. If not, create it.

Move all `.md` files from `docs/decisions/` to `docs/adr/` using bash commands.

After migration, check if `docs/decisions/` is empty. If so, remove the directory.

Note "ADRs: migrated from docs/decisions/ to docs/adr/" and continue.

If `docs/decisions/` does not exist, note "ADRs: no migration needed (docs/decisions/ not found)" and continue.

---

#### Step 5 — Migrate Labels

Print:

> **Step 5: Migrate GitHub labels**
>
> I'll help you migrate your GitHub labels to the MP label schema.
>
> **Labels to remove:**
> - `pending-review` (replaced by MP's triage workflow)
>
> **Labels to add (if missing):**
> - `needs-triage`
> - `needs-info`
> - `ready-for-agent`
> - `ready-for-human`
> - `wontfix`
>
> **Labels to keep:**
> - `bug`
> - `enhancement`
> - `documentation`
> - `duplicate`

Ask:

> "Would you like me to update the labels now? [yes/no]"

If the user says yes:

1. Use `gh label delete pending-review --yes` to remove the old label (ignore errors if it doesn't exist)
2. Use `gh label create` for each of the MP labels (ignore errors if they already exist):
   - `needs-triage` (color: `#f9d0c4`)
   - `needs-info` (color: `#fef2c0`)
   - `ready-for-agent` (color: `#c5def5`)
   - `ready-for-human` (color: `#d4c5f9`)
   - `wontfix` (color: `#eeeeee`)

Note "Labels: migrated" and continue.

If the user says no, note "Labels: skipped (user declined)" and continue.

---

#### Step 6 — Recommend /setup-matt-pocock-skills

Print:

> **Step 6: Configure MP skills for your repo (recommended)**
>
> Run `/setup-matt-pocock-skills` to configure:
> - Issue tracker setup (GitHub Issues)
> - Domain doc layout (`CONTEXT.md` and `docs/adr/`)
>
> This step is recommended but optional. You can run it later if you prefer.

Ask:

> "Would you like to run `/setup-matt-pocock-skills` now? [yes/no/skip]"

If the user says yes, print:

> "Run `/setup-matt-pocock-skills` in your AI assistant to configure your issue tracker and domain docs."

Note "MP skills configuration: user will run separately" and continue.
If the user says no or skips, note "MP skills configuration: skipped (user declined)" and continue.

---

#### Step 7 — List Obsolete Artifacts for Cleanup

Print:

> **Step 7: Obsolete artifacts for manual cleanup**
>
> Based on the migration analysis, the following artifacts are obsolete and should be removed:
>
> - `.superpowers/` — Superpowers configuration (no longer used)
> - `docs/superpowers/` — Superpowers documentation (no longer used)
> - `install.ps1`, `install.sh` — Install scripts (replaced by `npx skills`)
> - `vendor.json` — Vendor config (replaced by `npx skills`)
> - `lib/` — Helper scripts (no longer needed)
> - `.github/workflows/triaging-gh-issue.yml` — Auto-triage workflow (MP's `/triage` is conversational)
> - `agents/` directory — Reviewer agents (replaced by MP's `/code-review`)
> - Skills: `brainstorming-gh-issue`, `building-gh-issue`, `computing-branch-diff`, `move-issue-status`, `recording-decisions`, `reviewing-code-systematically`, `triaging-gh-issue`
> - Training evals for removed skills and agents
>
> **To remove these artifacts:**
>
> ```bash
> rm -rf .superpowers/ docs/superpowers/ lib/ agents/
> rm -f install.ps1 install.sh vendor.json .github/workflows/triaging-gh-issue.yml
> rm -rf skills/brainstorming-gh-issue skills/building-gh-issue skills/computing-branch-diff
> rm -rf skills/move-issue-status skills/recording-decisions skills/reviewing-code-systematically
> rm -rf skills/triaging-gh-issue
> rm -rf training/skills/brainstorming-gh-issue training/skills/building-gh-issue
> rm -rf training/skills/computing-branch-diff training/skills/move-issue-status
> rm -rf training/skills/recording-decisions training/skills/reviewing-code-systematically
> rm -rf training/skills/triaging-gh-issue training/skills/reviewer-docs
> rm -rf training/agents/
> ```

Note "Obsolete artifacts: listed for manual cleanup" and continue.

---

#### Step 8 — Verification

Print:

> **Step 8: Verification**
>
> Your repository has been migrated to the MP skills ecosystem:
> - MP skills ecosystem installed
> - Token-Effort complementary skills installed
> - ADRs migrated to `docs/adr/`
> - GitHub labels updated
> - Obsolete artifacts listed for cleanup
>
> **Next steps:**
> - Remove the obsolete artifacts listed above
> - Run `/setup-matt-pocock-skills` if you haven't already
> - Start using the skills! Try `/triage` on an issue, or `/implement` on a feature.

Note "Verification: complete" and proceed to the completion summary.

---

### Phase 3 — Completion Summary

Print a summary of the setup/migration:

**For Fresh Repo Bootstrap:**

```
✅ Done. Here's what was set up:
- MP skills: installed
- Token-Effort skills: installed
- MP skills configuration: [completed/skipped]
- Issue templates: [created/skipped]
- Dependabot: [configured/skipped]
- Verification: complete
```

**For Migration:**

```
✅ Done. Here's what was migrated:
- Superpowers artifacts detected: [list]
- MP skills: installed
- Token-Effort skills: installed
- ADRs: [migrated/no migration needed]
- Labels: [migrated/skipped]
- MP skills configuration: [completed/skipped]
- Obsolete artifacts: listed for manual cleanup
- Verification: complete
```

Adjust each line to reflect the actual outcome. Include only the steps that were executed.

No git commit is made. The user decides what to commit.

## Common Mistakes

- **Not asking for setup type** — always start by asking if this is a fresh repo or a migration.
- **Invoking `/setup-matt-pocock-skills` directly** — recommend it, but tell the user to run it themselves. Never invoke it via the Skill tool.
- **Performing Dependabot logic directly** — always delegate to `/configuring-dependabot`.
- **Skipping overwrite checks** — always warn and ask before writing any file that already exists.
- **Making a git commit after setup** — no git commit is made. The user decides what to commit.
- **Not detecting Superpowers artifacts in migration** — always scan for artifacts in Step 1 of the migration flow.
- **Not listing obsolete artifacts** — always provide a clear list of artifacts to remove in the migration flow.
- **Omitting steps from the summary** — every step must appear in the summary, even if skipped or declined.

## Eval

- [ ] Asked whether this is a fresh repo or a migration before proceeding
- [ ] Fresh flow: Instructed to install MP skills via `npx skills add mattpocock/skills`
- [ ] Fresh flow: Instructed to install Token-Effort via `npx skills add HeadlessTarry/Token-Effort`
- [ ] Fresh flow: Recommended `/setup-matt-pocock-skills` but did not invoke it directly
- [ ] Fresh flow: Created issue templates with correct labels (enhancement, bug)
- [ ] Fresh flow: Delegated Dependabot to `/configuring-dependabot`
- [ ] Migration flow: Scanned for Superpowers artifacts and printed a report
- [ ] Migration flow: Instructed to install MP skills and Token-Effort
- [ ] Migration flow: Migrated ADRs from `docs/decisions/` to `docs/adr/` if present
- [ ] Migration flow: Offered to update GitHub labels (remove `pending-review`, add MP labels)
- [ ] Migration flow: Recommended `/setup-matt-pocock-skills` but did not invoke it directly
- [ ] Migration flow: Listed obsolete artifacts for manual cleanup with removal commands
- [ ] Printed completion summary covering every step with accurate outcomes
- [ ] Made no git commit
