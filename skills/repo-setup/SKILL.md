---
name: repo-setup
description: Quick repository setup for Token-Effort. Creates issue templates and configures Dependabot.
---

# Repo Setup

Quick setup for Token-Effort. Creates GitHub issue templates and configures Dependabot.

**Usage:** `/repo-setup`

## When to Use

**Use when:**
- Setting up a new repository with Token-Effort skills
- Adding issue templates and Dependabot to an existing repository

**Do not use when:**
- You only want to configure Dependabot — run `/configuring-dependabot` directly instead

## Process

### Phase 1 — Issue Templates

Check if any of the following files exist:
- `.github/ISSUE_TEMPLATE/01-feature_request.md`
- `.github/ISSUE_TEMPLATE/02-bug_report.md`
- `.github/ISSUE_TEMPLATE/config.yml`

If any exist:

> "One or more issue template files already exist. Overwrite all? [yes/no]"

Wait for confirmation. If the user says no, note "Issue templates: skipped (overwrite declined)" and continue to Phase 2.

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

Note "Issue templates: created" and continue to Phase 2.

---

### Phase 2 — Dependabot Configuration

Check if `.github/dependabot.yml` exists.

If it exists:

> "`.github/dependabot.yml` already exists. Overwrite? [yes/no]"

Wait for confirmation. If the user says no, note "Dependabot: skipped (overwrite declined)" and proceed to Phase 3.

Invoke: `/configuring-dependabot`

Do not perform any Dependabot logic directly. The sub-skill handles all scanning, overwrite detection, and file writing.

---

### Phase 3 — Completion

Print a summary:

```
✅ Done. Here's what was set up:
- Issue templates: [created/skipped]
- Dependabot: [configured/skipped]
```

Adjust each line to reflect the actual outcome.

No git commit is made. The user decides what to commit.

## Common Mistakes

- **Performing Dependabot logic directly** — always delegate to `/configuring-dependabot`.
- **Skipping overwrite checks** — always warn and ask before writing any file that already exists.
- **Making a git commit after setup** — no git commit is made. The user decides what to commit.
- **Omitting steps from the summary** — every step must appear in the summary, even if skipped.

## Eval

- [ ] Checked for existing issue templates before writing
- [ ] Warned and confirmed before overwriting existing templates
- [ ] Created all three template files with correct content
- [ ] Feature request template includes `labels: enhancement`
- [ ] Bug report template includes `labels: bug`
- [ ] config.yml contains `blank_issues_enabled: false`
- [ ] Checked for existing dependabot.yml before configuring
- [ ] Warned and confirmed before overwriting existing dependabot.yml
- [ ] Delegated to `/configuring-dependabot` via Skill tool
- [ ] Did not perform any Dependabot logic directly
- [ ] Printed completion summary with accurate outcomes
- [ ] Made no git commit
