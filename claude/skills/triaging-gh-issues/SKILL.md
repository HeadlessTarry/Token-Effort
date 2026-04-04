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

The `gh` CLI must be authenticated and available in the session. All GitHub issue operations use `gh` commands via `Bash`. No MCP tools are used or required.

> **Important:** Do **not** use MCP tools (`mcp__plugin_github_github__*`) for any issue operation, even if they appear to be available.

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

This is always set by the GitHub Actions runner in the format `owner/repo` (e.g. `TheTarry/Token-Effort`). Split on `/` to extract `$OWNER` (everything before the first `/`) and `$REPO` (everything after).

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

### Phase 2 — Fetch ALL open issues

Run:

```bash
gh issue list --repo $OWNER/$REPO --state open --limit 1000 --json number,title,body,labels
```

This returns a JSON array. Each element contains `number`, `title`, `body`, and `labels` (array of label objects with a `name` field).

Do NOT filter by label — retrieve all open issues regardless of their current labels.

If the array is empty, report: "No open issues found." and stop.

### Phase 3 — Classify each issue

For each issue in the list, perform the following steps in order. Process all issues before moving to Phase 4 — do not pause for approval between individual issues.

#### Step 3a — Read the full issue

Use the `title`, `body`, and `labels` already present in the Phase 2 JSON response. No additional read call is needed.

Note the issue's current labels (may be empty).

#### Step 3b — Search for duplicates

Run:

```bash
gh search issues "<first 10-12 significant words of title and description>" --repo $OWNER/$REPO --state all --json number,title --limit 20
```

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

> **Search failure handling:** If `gh search issues` fails for a specific issue, skip the duplicate check for that issue (treat as no duplicate found) and continue. Record it as a search error in the final report.

### Phase 4 — Detect context

Check the environment variable `GITHUB_ACTIONS` using the following expansion-free command:

```bash
printenv GITHUB_ACTIONS
```

- If the output is non-empty → skip Phase 5 and go directly to Phase 6 (no confirmation required)
- If the output is empty → continue to Phase 5

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

1. Apply the label:

   - For `apply` (no previous label):
     ```bash
     gh issue edit $N --repo $OWNER/$REPO --add-label "<label>"
     ```

   - For `reclassify` (issue had a non-empty previous label):
     ```bash
     gh issue edit $N --repo $OWNER/$REPO --remove-label "<old_label>" --add-label "<new_label>"
     ```

2. If the action was `reclassify`, post a comment:

   ```bash
   gh issue comment $N --repo $OWNER/$REPO --body "**Label updated by automated triage**
   This issue was originally filed under the \`{old_label}\` type. Following re-analysis, it has been reclassified as \`{new_label}\`. The original issue description may not follow the standard template for \`{new_label}\` issues."
   ```

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

- **Filtering by label in Phase 2** — `gh issue list` must NOT use a label filter. Fetch all open issues.
- **Including no-change issues in the summary** — issues where the current label already matches the classification must be silently skipped and excluded from the summary table.
- **Re-labelling ambiguous issues** — only reclassify when the existing label is CLEARLY wrong. When in doubt, leave the label unchanged.
- **Posting a comment on newly labelled issues** — comments are only for `reclassify` actions (previous label existed). Do not post a comment when applying a label for the first time.
- **Applying labels before approval** — Phase 6 must not run until the user has confirmed in Phase 5 (unless `GITHUB_ACTIONS` is set). Do not call `gh issue edit` during classification.
- **Skipping the duplicate search** — every issue must go through Step 3b even if the title seems clearly a bug or enhancement. Duplicates take precedence.
- **Assigning multiple labels** — each issue gets exactly one label. Choose the most specific.
- **Stopping after the first issue** — classify all issues in one pass before presenting the summary. Do not pause for approval between individual issues.
- **Failing silently on write errors** — report each failure individually; do not abort the entire batch because one call fails.
- **Re-fetching issues during Phase 6** — use the triage list already assembled in Phases 2 and 3. Do not re-run `gh issue list`.
- **Using a hardcoded owner/repo** — in GitHub Actions, always derive from `GITHUB_REPOSITORY`; in interactive sessions, always derive from `git remote get-url origin`. Never hardcode the owner or repo.
- **Falling back to `git remote` in GitHub Actions** — if `GITHUB_REPOSITORY` is missing in a GHA context, stop with an error. Do not call `git remote get-url origin` as a fallback.
- **Using shell expansion syntax to read environment variables** — never use `${VARIABLE}`, `${VARIABLE:-}`, or any `${...}` form in bash commands. Claude Code's sandbox blocks these with a "Contains expansion" error. Always use `printenv VARIABLE` instead.
- **Prompting for confirmation when there is nothing to confirm** — if all issues resolved to `no-change`, skip Phase 5 entirely. Do not display an empty summary table or ask the user to confirm a list with zero changes.
- **Using MCP tools for issue operations** — all issue interactions (listing, searching, writing labels, posting comments) must use `gh` CLI commands. Never call `mcp__plugin_github_github__list_issues`, `mcp__plugin_github_github__issue_read`, `mcp__plugin_github_github__search_issues`, `mcp__plugin_github_github__issue_write`, `mcp__plugin_github_github__add_issue_comment`, or any other `mcp__` tool for issue operations.

## Eval

- [ ] In GitHub Actions context (`GITHUB_ACTIONS` set): owner and repo were derived from `GITHUB_REPOSITORY`, not from `git remote get-url origin`
- [ ] In GitHub Actions context: if `GITHUB_REPOSITORY` was empty/absent, execution stopped with an error and `git remote get-url origin` was NOT called
- [ ] In interactive context (`GITHUB_ACTIONS` not set): owner and repo were derived from `git remote get-url origin`, not hardcoded
- [ ] If the remote URL could not be parsed (interactive context), execution stopped and the user was asked to provide the owner/repo
- [ ] `gh issue list` was called with `--state open`, `--limit 1000`, and NO label filter — all open issues were fetched in a single call
- [ ] If zero open issues were returned, execution stopped with "No open issues found."
- [ ] No separate per-issue read call was made — title, body, and labels were taken from the Phase 2 JSON response
- [ ] `gh search issues` was called for every open issue using the first 10–12 significant words of the title
- [ ] `duplicate` label was assigned when a matching issue was found, regardless of other signals
- [ ] Exactly one label was assigned per issue
- [ ] Issues where the current label already matches the classified label were assigned action `no-change` and excluded from the summary and from all writes
- [ ] Issues where the current label differs but the difference is ambiguous were also assigned action `no-change` and excluded from the summary
- [ ] Only issues with action `apply` or `reclassify` appeared in the triage summary table
- [ ] The `GITHUB_ACTIONS` environment variable was checked before Phase 5
- [ ] If `GITHUB_ACTIONS` was set and non-empty, Phase 5 was skipped and changes were applied directly
- [ ] If `GITHUB_ACTIONS` was not set, the summary table was displayed and the user was asked to confirm before any writes occurred
- [ ] `gh issue edit` was NOT called for `no-change` issues
- [ ] For `apply` issues: `gh issue edit --add-label` was called with the assigned label
- [ ] For `reclassify` issues: `gh issue edit --remove-label <old> --add-label <new>` was called
- [ ] `gh issue comment` was called for every `reclassify` issue (previous label existed) after the label was updated
- [ ] `gh issue comment` was NOT called for `apply` issues (no previous label)
- [ ] If `gh search issues` failed for a specific issue, that issue's duplicate check was skipped without aborting the batch
- [ ] Each `gh issue edit` or `gh issue comment` failure was reported individually without aborting the remaining batch
- [ ] Final summary reported counts for: labels applied (new), labels updated (reclassified), issues unchanged, and failures
- [ ] No `mcp__` tool was called at any point
