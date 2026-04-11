---
name: move-issue-status
description: Use when moving a GitHub issue to a specific project board status, or advancing it to the next column.
user-invocable: true
---

# Move Issue Status

## Overview

Moves a GitHub issue to a named project board status column (explicit mode), or advances it one column to the right if it is currently in the first column (advance mode). All project board operations use the `gh` CLI. No MCP tools are used or required.

**Usage:** `/token-effort:move-issue-status <issue-number> [<status>]`

- `<issue-number>` — the GitHub issue number (leading `#` is stripped automatically)
- `<status>` — optional; the exact name of the target status column (case-insensitive). Omit to use advance mode.

## When to Use

**Use when:**
- You want to move an issue to a specific named project board column
- You want to advance an issue from its current first-column status to the next column

**Do not use when:**
- You need to move multiple issues at once (run the skill once per issue)
- You want to label or otherwise edit an issue (use `triaging-gh-issues` instead)

## Prerequisites

The `gh` CLI must be authenticated and available in the session. All project board operations use `gh` commands via Bash. No MCP tools are used or required.

> **Important:** Do **not** use MCP tools (`mcp__plugin_github_github__*`) for any operation, even if they appear to be available.

## Process

### Phase 1 — Resolve owner/repo and normalise issue number

Strip any leading `#` from the issue number argument (e.g. `#42` → `42`).

**If running in GitHub Actions** (`GITHUB_ACTIONS` is set and non-empty):

To detect the GHA context, run the following expansion-free command:

```bash
printenv GITHUB_ACTIONS
```

If the output is non-empty, you are in GitHub Actions.

Read the `GITHUB_REPOSITORY` environment variable using:

```bash
printenv GITHUB_REPOSITORY
```

This is always set by the GitHub Actions runner in the format `owner/repo` (e.g. `HeadlessTarry/Token-Effort`). Split on `/` to extract `$OWNER` (everything before the first `/`) and `$REPO` (everything after).

If `GITHUB_REPOSITORY` is empty or absent, stop immediately and report: "I could not determine the GitHub repository: the `GITHUB_REPOSITORY` environment variable is not set. Please check your workflow configuration." Do NOT call `git remote get-url origin` as a fallback.

**Otherwise** (interactive / local session, `GITHUB_ACTIONS` is not set):

Run the following Bash command to get the remote URL and extract the owner/repo:

```bash
git remote get-url origin
```

Parse owner and repo from the output. Supported URL forms:
- `https://github.com/<owner>/<repo>.git` → strip `.git`, split on `/`
- `git@github.com:<owner>/<repo>.git` → strip `.git`, split on `:`

Store as `$OWNER` and `$REPO`. If the command fails or the URL cannot be parsed, stop and ask the user: "I could not determine the GitHub repository from `git remote get-url origin`. Please provide the owner/repo (e.g. `acme/my-repo`)."

### Phase 2 — Find project(s) containing the issue

1. List all projects for the owner:

   ```bash
   gh project list --owner $OWNER --format json --limit 100
   ```

2. For each project returned, fetch its items:

   ```bash
   gh project item-list <project-number> --owner $OWNER --format json --limit 1000
   ```

   Filter items whose `content.number` matches the issue number. For each match, collect:
   - item ID
   - project number
   - project ID
   - project name
   - current status name (may be null/empty)

After scanning all projects, you have a list of matching projects (zero, one, or many).

**In explicit mode:** if the list is empty (issue belongs to no project), report the error: "Issue #N is not on any GitHub project board." and stop. Do not call `gh project item-edit`.

**In advance mode:** apply the following silent-skip preconditions in order — stop and skip silently (no error, no output) if any condition is met:
- Issue belongs to zero projects
- Issue belongs to more than one project

### Phase 3 — Determine the target status

#### Explicit mode (`<status>` was provided)

Fetch the fields for the project that contains the issue:

```bash
gh project field-list <project-number> --owner $OWNER --format json
```

Find the field named `Status` with type `single_select`. Its `options` array contains the available status values in display order.

- If no `Status` field exists → report an error and stop.
- Search `options` for an entry whose `name` matches `<status>` using a case-insensitive comparison.
- If no matching option is found → report an error that includes the list of available option names and stop.
- If a match is found → record the option's `id` as the target option ID.

#### Advance mode (`<status>` was omitted)

Fetch the fields for the project that contains the issue:

```bash
gh project field-list <project-number> --owner $OWNER --format json
```

Find the field named `Status` with type `single_select`. Apply the following silent-skip preconditions in order:

- If no `Status` field exists → skip silently.
- If the issue's current status (from Phase 2) is null or empty → skip silently.
- Find the index of the current status name in the `options` array.
  - If the current status name is not found in the array → skip silently.
  - If `current_index > 0` (issue is NOT in the first column) → skip silently.
  - If the current status is the last option (no `options[current_index + 1]` exists) → skip silently.
- Otherwise, the target option is `options[current_index + 1]`. Record its `id` as the target option ID.

### Phase 4 — Apply and report

Run the following command to move the item:

```bash
gh project item-edit --project-id <project-id> --id <item-id> --field-id <status-field-id> --single-select-option-id <target-option-id>
```

- **Success:** report "Moved issue #N to '<target-status-name>' in project '<project-name>'"
- **Failure:** report the `gh` error message clearly and stop.

## Common Mistakes

- **Using shell expansion syntax** — never use `${VAR}`, `${VAR:-}`, or any `${...}` form in bash commands. Claude Code's sandbox blocks these with a "Contains expansion" error. Always use `printenv VARIABLE` instead.
- **Treating advance mode and explicit mode identically** — explicit mode moves the issue regardless of its current column position; advance mode has strict preconditions that must all pass before any write occurs.
- **Calling `gh project item-edit` in advance mode when issue is not at the first column** — if `current_index > 0`, skip silently.
- **Calling `gh project item-edit` when issue belongs to multiple projects in advance mode** — skip silently when more than one project contains the issue.
- **Hardcoding status names** — do not hardcode the target status name. Always look up options from the `Status` field's `options` array and advance by index.
- **Hardcoding the project number** — always derive the project number from `gh project list` and `gh project item-list` lookups.
- **Skipping the project list lookup** — do not assume a project number or project ID. Run Phase 2 in full for every invocation.
- **Using MCP tools for any operation** — all interactions with GitHub (issues, projects, fields) must use `gh` CLI commands. Never call any `mcp__` tool.
- **Reporting an error for advance-mode precondition failures** — when a silent-skip precondition is met in advance mode, produce no output and stop quietly. Reserve errors for explicit mode failures.
- **Calling `gh project item-edit` when the issue has no current status set (advance mode)** — if the item's status is null or empty, skip silently.
- **Calling `gh project item-edit` when the issue is already at the last column (advance mode)** — if no `options[current_index + 1]` exists, skip silently.
- **Calling `gh project item-edit` when issue belongs to zero projects in advance mode** — skip silently; do not report an error.
- **Performing a case-sensitive match on status names in explicit mode** — the `<status>` argument must be matched case-insensitively against the `options` array.

## Eval

- [ ] Leading `#` stripped from issue number if present
- [ ] Owner/repo resolved correctly (GHA vs interactive)
- [ ] `gh project list` and `gh project item-list` used to find the project(s)
- [ ] In advance mode: execution stopped silently when issue belongs to zero projects
- [ ] In advance mode: execution stopped silently when issue belongs to more than one project
- [ ] In advance mode: execution stopped silently when current status is null/empty
- [ ] In advance mode: execution stopped silently when current status is NOT at index 0
- [ ] In advance mode: execution stopped silently when current status is the last option
- [ ] In advance mode: `gh project item-edit` called with options[current_index + 1]
- [ ] In explicit mode: Status field options fetched and searched by name (case-insensitive)
- [ ] In explicit mode: error reported if named status option not found
- [ ] In explicit mode: `gh project item-edit` called regardless of current column position
- [ ] Success message includes issue number, status name, and project name
- [ ] No MCP tools used
- [ ] No `${...}` shell expansion used
