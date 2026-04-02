---
name: triaging-gh-issues
description: Use when the user wants to label unlabelled open GitHub issues in the current repository.
user-invocable: true
---

# GitHub Issue Triage

## Overview

Fetches all open GitHub issues that have no labels, classifies each one by reading its content and searching for duplicates among all issues (open and closed), then proposes a label assignment for each. Presents a summary of decisions with reasoning and waits for user approval before applying any labels.

**Usage:** `/triage-gh-issues`

## When to Use

**Use when:**
- There are open issues in the repository that have no labels and need classification
- You want a structured, approval-gated triage pass over new issues

**Do not use when:**
- All open issues already have labels — the skill will report nothing to triage and stop
- You want to re-label already-labelled issues — this skill only processes unlabelled issues

## Prerequisites

The following MCP tools must be available in the session:

| Tool | Purpose |
|------|---------|
| `mcp__plugin_github_github__list_issues` | List open issues |
| `mcp__plugin_github_github__issue_read` | Read issue body and comments |
| `mcp__plugin_github_github__search_issues` | Search for duplicates |
| `mcp__plugin_github_github__issue_write` | Apply labels |

## Labels

| Label | When to assign |
|-------|---------------|
| `enhancement` | A request for new behaviour, a new feature, or an improvement to existing functionality |
| `bug` | A report of something that is broken, not working as expected, or producing an error |
| `documentation` | A request for new or improved documentation, or a report that docs are wrong/missing |
| `duplicate` | Substantially the same issue already exists (open or closed) |

Assign exactly one label per issue. When an issue could fit multiple labels, choose the most specific match: `duplicate` takes precedence over all others; otherwise prefer the label that best describes the primary request.

## Process

### Phase 1 — Resolve the repository

Run the following Bash command to get the remote URL and extract the owner/repo:

```bash
git remote get-url origin
```

Parse owner and repo from the output. Supported URL forms:
- `https://github.com/<owner>/<repo>.git` → strip `.git`, split on `/`
- `git@github.com:<owner>/<repo>.git` → strip `.git`, split on `:`

Store as `$OWNER` and `$REPO`. If the command fails or the URL cannot be parsed, stop and ask the user: "I could not determine the GitHub repository from `git remote get-url origin`. Please provide the owner/repo (e.g. `acme/my-repo`)."

### Phase 2 — Fetch unlabelled open issues

Call `mcp__plugin_github_github__list_issues` with:
- `owner`: `$OWNER`
- `repo`: `$REPO`
- `state`: `open`

From the response, keep only issues where the `labels` array is empty (or absent). Store these as the **triage list**.

If the triage list is empty, report: "All open issues already have labels. Nothing to triage." and stop.

Otherwise report: "Found N unlabelled open issues. Starting triage…"

### Phase 3 — Classify each issue

For each issue in the triage list, perform the following steps in order. Process all issues before moving to Phase 4 — do not pause for approval between individual issues.

#### Step 3a — Read the full issue

Call `mcp__plugin_github_github__issue_read` with:
- `owner`: `$OWNER`
- `repo`: `$REPO`
- `issue_number`: the issue number

Capture the title and body.

#### Step 3b — Search for duplicates

Call `mcp__plugin_github_github__search_issues` with:
- `owner`: `$OWNER`
- `repo`: `$REPO`
- `query`: the issue title (use the first 10–12 significant words)
- `state`: `all` (search both open and closed issues)

Review the results. An issue is a duplicate if:
- The title and description are substantially the same as this issue, AND
- The matching issue is a different issue number (not the same issue)

If a duplicate is found, record the matching issue number as evidence.

#### Step 3c — Assign a label

Apply the label rules:

1. If a duplicate was found in Step 3b → assign `duplicate`, record the matching issue number
2. Else if the title/body describes something broken, not working, or producing an error → assign `bug`
3. Else if the title/body asks for new or improved documentation → assign `documentation`
4. Else → assign `enhancement`

Record the assigned label and a one-sentence rationale for each issue.

### Phase 4 — Present the triage summary

Output a summary table followed by per-issue reasoning:

```
## Triage Summary

| # | Title | Proposed Label | Reasoning |
|---|-------|----------------|-----------|
| 42 | Short title | enhancement | Requests a new export feature |
| 43 | Short title | bug | Reports a crash when clicking Save |
| 44 | Short title | duplicate | Same as #31 (closed) |

---

Apply these labels? (yes / no / edit)
- **yes** — apply all labels as proposed
- **no** — discard, no changes made
- **edit** — specify which issues to change before applying
```

Wait for the user's response before proceeding.

### Phase 5 — Handle user response

**If "yes":** proceed to Phase 6 with the full triage list.

**If "no":** report "No labels applied. Triage discarded." and stop.

**If "edit":** ask the user to specify the changes (e.g. "change #42 to bug, skip #44"). Update the triage list accordingly, re-display the updated table, and ask for confirmation again. Repeat until the user confirms with "yes" or cancels with "no".

### Phase 6 — Apply labels

For each issue in the approved triage list, call `mcp__plugin_github_github__issue_write` with:
- `owner`: `$OWNER`
- `repo`: `$REPO`
- `issue_number`: the issue number
- `labels`: an array containing the single assigned label string

After all calls complete, report:

```
Labels applied:

- #42 → enhancement
- #43 → bug
- #44 → duplicate

Done. N labels applied.
```

If any individual `issue_write` call fails, report the failure for that issue number with the error, continue applying the remaining labels, and include a "Failed: #X (reason)" line in the final report.

## Common Mistakes

- **Applying labels before approval** — Phase 6 must not run until the user has confirmed in Phase 5. Do not call `issue_write` during classification.
- **Skipping the duplicate search** — every issue must go through Step 3b even if the title seems clearly a bug or enhancement. Duplicates take precedence.
- **Assigning multiple labels** — each issue gets exactly one label. Choose the most specific.
- **Stopping after the first issue** — classify all issues in one pass before presenting the summary. Do not pause for approval between individual issues.
- **Failing silently on `issue_write` errors** — report each failure individually; do not abort the entire batch because one call fails.
- **Re-fetching issues during Phase 6** — use the triage list already assembled in Phase 2 and 3. Do not re-list issues.
- **Using a hardcoded owner/repo** — always derive from `git remote get-url origin` at runtime.

## Eval

- [ ] Owner and repo were derived from `git remote get-url origin`, not hardcoded
- [ ] If remote URL could not be parsed, execution stopped and the user was asked to provide the owner/repo
- [ ] Only issues with no labels were included in the triage list
- [ ] If the triage list was empty, execution stopped with the "All open issues already have labels" message
- [ ] `issue_read` was called for every issue in the triage list
- [ ] `search_issues` was called for every issue in the triage list using the issue title
- [ ] `duplicate` label was assigned when a matching issue was found, regardless of other signals
- [ ] Exactly one label was assigned per issue
- [ ] The triage summary table was displayed before any labels were applied
- [ ] `issue_write` was not called until the user responded "yes" (or confirmed after an edit round)
- [ ] If the user said "no", no labels were applied
- [ ] If the user said "edit", the updated table was re-displayed before applying
- [ ] Labels were applied via `issue_write` with a single-element `labels` array
- [ ] Each `issue_write` failure was reported individually without aborting the remaining batch
- [ ] Final report listed each applied label and the total count
