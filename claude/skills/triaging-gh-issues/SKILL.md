---
name: triaging-gh-issues
description: Use when the user wants to triage open GitHub issues in the current repository — labelling unlabelled issues and correcting obviously wrong labels.
user-invocable: true
---

# GitHub Issue Triage

## Overview

Fetches all open GitHub issues, classifies each one by reading its content and searching for duplicates, then determines whether to apply a new label or correct an existing one. Issues that already have the correct label are skipped silently. Presents a summary of proposed changes and waits for user confirmation before applying any writes (unless running in GitHub Actions, where it applies changes immediately).

**Usage:** `/triaging-gh-issues`

## When to Use

**Use when:**
- There are open issues in the repository that need classification or label correction
- You want a structured, approval-gated triage pass over all open issues

**Do not use when:**
- You want to interactively triage issues one at a time rather than in a batch

## Prerequisites

The following MCP tools must be available in the session:

| Tool | Purpose |
|------|---------|
| `mcp__plugin_github_github__list_issues` | Fetch all open issues |
| `mcp__plugin_github_github__issue_read` | Read issue title and body |
| `mcp__plugin_github_github__search_issues` | Duplicate detection |
| `mcp__plugin_github_github__issue_write` | Apply label |
| `mcp__plugin_github_github__add_issue_comment` | Post reclassification comment |

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

### Phase 2 — Fetch ALL open issues

Call `mcp__plugin_github_github__list_issues` with:
- `owner`: `$OWNER`
- `repo`: `$REPO`
- `state`: `open`
- `perPage`: `100`

Do NOT filter by label — retrieve all open issues regardless of their current labels.

Paginate until all issues are collected: if the response's `pageInfo.hasNextPage` is `true`, call `list_issues` again with `after` set to `pageInfo.endCursor`, repeating until `hasNextPage` is `false`. Accumulate all issues across pages into a single list before proceeding.

If the accumulated list is empty, report: "No open issues found." and stop.

### Phase 3 — Classify each issue

For each issue in the list, perform the following steps in order. Process all issues before moving to Phase 4 — do not pause for approval between individual issues.

#### Step 3a — Read the full issue

Call `mcp__plugin_github_github__issue_read` with:
- `owner`: `$OWNER`
- `repo`: `$REPO`
- `issue_number`: the issue number

Capture the title and body. Also note the issue's current labels (may be empty).

#### Step 3b — Search for duplicates

Call `mcp__plugin_github_github__search_issues` with:
- `owner`: `$OWNER`
- `repo`: `$REPO`
- `query`: the first 10–12 significant words of the issue title and description
- `state`: `all` (search both open and closed issues)

Review the results. An issue is a duplicate if:
- The title and description are substantially the same as this issue, AND
- The matching issue has a different issue number (not the same issue)

If a duplicate is found, record the matching issue number as evidence.

#### Step 3c — Determine the classification

Apply the label rules:

1. If a duplicate was found in Step 3b → assign `duplicate`, record the matching issue number
2. Else if the title/body describes something broken, not working, or producing an error → assign `bug`
3. Else if the title/body asks for new or improved documentation → assign `documentation`
4. Else → assign `enhancement`

Record the assigned label and a one-sentence rationale.

#### Step 3d — Determine the action

Compare the classified label to the issue's current label(s):

> **Multi-label note:** If the issue has multiple current labels, treat the first label in the array as the "current label" for comparison purposes. Apply the same apply/reclassify/no-change logic against that first label.

| Situation | Action |
|-----------|--------|
| Issue has no current label | `apply` — will label it; no comment needed |
| Current label matches the classified label | `no-change` — skip entirely; do not include in summary |
| Current label differs AND the difference is CLEARLY wrong (e.g. a bug report labelled `enhancement`) | `reclassify` — will re-label and post a comment |
| Current label differs BUT the difference is ambiguous or uncertain | `no-change` — err on the side of not changing; skip from summary |

Only include issues with action `apply` or `reclassify` in the triage list carried forward to Phase 4.

> **Read/search failure handling:** If `issue_read` or `search_issues` fails for a specific issue, skip that issue, record it as a read failure, and continue to the next issue. Include read failures in the final report under a "Read errors: N" line.

### Phase 4 — Detect context

Check the environment variable `GITHUB_ACTIONS`:

```bash
echo "${GITHUB_ACTIONS:-}"
```

- If it is set and non-empty → skip Phase 5 and go directly to Phase 6 (no confirmation required)
- If it is not set or empty → continue to Phase 5

### Phase 5 — Interactive confirmation (skipped in GitHub Actions)

If the triage list contains no issues with action `apply` or `reclassify` (all issues resolved to `no-change`), skip Phase 5 entirely — there is nothing to confirm. Proceed directly to the final report in Phase 6 (which will also be a no-op).

Display a summary table of all issues with action `apply` or `reclassify`:

```
## Triage Summary

| # | Title | Current Label | Proposed Label | Action |
|---|-------|---------------|----------------|--------|
| 42 | Short title | (none) | enhancement | apply |
| 55 | Short title | enhancement | bug | reclassify |

---

Apply these changes? (yes / no / edit)
- **yes** — apply all changes as proposed
- **no** — discard, no changes made
- **edit** — specify which issues to change before applying
```

Wait for the user's response before proceeding.

**If "yes":** proceed to Phase 6 with the full triage list.

**If "no":** report "No changes applied. Triage discarded." and stop.

**If "edit":** ask the user to specify the changes (e.g. "change #42 to bug, skip #55"). Update the triage list accordingly, re-display the updated table, and ask for confirmation again. Repeat until the user confirms with "yes" or cancels with "no".

### Phase 6 — Apply changes

For each issue in the approved triage list (action `apply` or `reclassify`):

1. Call `mcp__plugin_github_github__issue_write` with:
   - `owner`: `$OWNER`
   - `repo`: `$REPO`
   - `issue_number`: the issue number
   - `labels`: a single-element array containing the assigned label string

2. If the action was `reclassify` (the issue had a non-empty previous label), call `mcp__plugin_github_github__add_issue_comment` with the body:

   > **Label updated by automated triage**
   > This issue was originally filed under the `{old_label}` type. Following re-analysis, it has been reclassified as `{new_label}`. The original issue description may not follow the standard template for `{new_label}` issues.

   Do NOT post a comment for `apply` actions (issues that had no previous label).

If any individual call fails, report the failure for that issue and continue processing the remaining issues — do not abort the batch.

After all calls complete, report:

```
Triage complete:
- N label(s) applied (new)
- N label(s) updated (reclassified)
- N issue(s) unchanged
- N failure(s)
```

## Common Mistakes

- **Filtering by label in Phase 2** — `list_issues` must NOT use a label filter. Fetch all open issues.
- **Including no-change issues in the summary** — issues where the current label already matches the classification must be silently skipped and excluded from the summary table.
- **Re-labelling ambiguous issues** — only reclassify when the existing label is CLEARLY wrong. When in doubt, leave the label unchanged.
- **Posting a comment on newly labelled issues** — comments are only for `reclassify` actions (previous label existed). Do not post a comment when applying a label for the first time.
- **Applying labels before approval** — Phase 6 must not run until the user has confirmed in Phase 5 (unless `GITHUB_ACTIONS` is set). Do not call `issue_write` during classification.
- **Skipping the duplicate search** — every issue must go through Step 3b even if the title seems clearly a bug or enhancement. Duplicates take precedence.
- **Assigning multiple labels** — each issue gets exactly one label. Choose the most specific.
- **Stopping after the first issue** — classify all issues in one pass before presenting the summary. Do not pause for approval between individual issues.
- **Failing silently on write errors** — report each failure individually; do not abort the entire batch because one call fails.
- **Re-fetching issues during Phase 6** — use the triage list already assembled in Phases 2 and 3. Do not re-list issues.
- **Using a hardcoded owner/repo** — always derive from `git remote get-url origin` at runtime.
- **Prompting for confirmation when there is nothing to confirm** — if all issues resolved to `no-change`, skip Phase 5 entirely. Do not display an empty summary table or ask the user to confirm a list with zero changes.

## Eval

- [ ] Owner and repo were derived from `git remote get-url origin`, not hardcoded
- [ ] If the remote URL could not be parsed, execution stopped and the user was asked to provide the owner/repo
- [ ] `list_issues` was called with `state: open` and NO label filter — all open issues were fetched
- [ ] If zero open issues were returned, execution stopped with "No open issues found."
- [ ] `issue_read` was called for every open issue
- [ ] `search_issues` was called for every open issue using the first 10–12 significant words of the title
- [ ] `duplicate` label was assigned when a matching issue was found, regardless of other signals
- [ ] Exactly one label was assigned per issue
- [ ] Issues where the current label already matches the classified label were assigned action `no-change` and excluded from the summary and from all writes
- [ ] Issues where the current label differs but the difference is ambiguous were also assigned action `no-change` and excluded from the summary
- [ ] Only issues with action `apply` or `reclassify` appeared in the triage summary table
- [ ] The `GITHUB_ACTIONS` environment variable was checked before Phase 5
- [ ] If `GITHUB_ACTIONS` was set and non-empty, Phase 5 was skipped and changes were applied directly
- [ ] If `GITHUB_ACTIONS` was not set, the summary table was displayed and the user was asked to confirm before any writes occurred
- [ ] `issue_write` was NOT called for `no-change` issues
- [ ] `issue_write` was called with a single-element `labels` array for each `apply` and `reclassify` issue
- [ ] `add_issue_comment` was called for every `reclassify` issue (previous label existed) after the label was updated
- [ ] `add_issue_comment` was NOT called for `apply` issues (no previous label)
- [ ] If `issue_read` or `search_issues` failed for a specific issue, that issue was skipped and recorded as a read error without aborting the batch
- [ ] Each `issue_write` or `add_issue_comment` failure was reported individually without aborting the remaining batch
- [ ] Final summary reported counts for: labels applied (new), labels updated (reclassified), issues unchanged, and failures
