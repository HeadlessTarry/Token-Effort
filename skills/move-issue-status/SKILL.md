---
name: move-issue-status
description: Use when moving a GitHub issue to a named project board status column — explicit mode only. Blocks if the issue carries a pending-review label.
---

# Move Issue Status

## Overview

Moves a GitHub issue to a named project board status column using `gh` CLI commands. All logic is deterministic — the skill parses JSON responses with `jq` and branches accordingly. Blocks movement if the issue carries a `pending-review` label.

## When to Use

**Use when:**
- A downstream skill (e.g. `triaging-gh-issue`, `brainstorming-gh-issue`, `planning-gh-issue`, `building-gh-issue`) completes and needs to advance the issue to a specific project board column
- You need to manually move an issue to a named status

**Do not use when:**
- You want to auto-advance one column — this skill only supports explicit status targeting

## Prerequisites

- `gh` CLI (authenticated)
- `jq` for JSON parsing
- The issue must exist on a GitHub Project board
- The target project board must have a `Status` field of type `SingleSelect`

## Process

### Phase 1 — Resolve issue number and repository

**Resolve the issue number:**

1. If an issue number was provided as an argument (e.g. `42` or `#42`), extract it and strip any leading `#`. That is the resolved issue number. Do not call `git branch --show-current`.

2. If no argument was provided, run:

```bash
git branch --show-current
```

Extract the **first** sequence of digits from the branch name. Examples:
- `42-some-feature` → `42`
- `feature/42-foo` → `42`
- `fix/42` → `42`

If no digits found, stop with:

> "No issue number found. Provide an issue number as an argument (e.g. `42` or `#42`)."

**Resolve the repository:**

**If running in GitHub Actions** (`GITHUB_ACTIONS` is set and non-empty):

```bash
printenv GITHUB_REPOSITORY
```

Split on `/` to extract owner and repo. If empty or absent, stop with:

> "I could not determine the GitHub repository: the `GITHUB_REPOSITORY` environment variable is not set."

Do NOT call `git remote get-url origin` as a fallback.

**Otherwise** (interactive session):

```bash
git remote get-url origin
```

Parse owner and repo from:
- `https://github.com/<owner>/<repo>.git` → strip `.git`, split on `/`
- `git@github.com:<owner>/<repo>.git` → strip `.git`, split on `:`

If it fails or cannot be parsed, stop with:

> "I could not determine the repository from `git remote get-url origin`. Provide owner/repo (e.g. `acme/my-repo`)."

### Phase 2 — Check for pending-review label

```bash
gh issue view <N> --json labels
```

Use `jq` to check if any label name equals `pending-review`:

```bash
echo '<json-output>' | jq '[.labels[] | select(.name == "pending-review")] | length'
```

If the result is greater than 0, stop with:

> "Issue #<N> has a pending-review label. Manual review required — the issue cannot be moved automatically."

Do not proceed to any project board commands.

### Phase 3 — Find the issue on a project board

```bash
gh project list --owner <owner> --format json --limit 100
```

For each project in the response, extract its `number` and run:

```bash
gh project item-list <project_number> --owner <owner> --format json --limit 1000
```

Use `jq` to find items matching the issue number:

```bash
echo '<item-list-json>' | jq '[.items[] | select(.content.number == <N>)]'
```

Collect all matching projects. After checking all projects:

- **Zero matches:** Stop with error:
  > "Issue #<N> is not on any GitHub project board."

- **Multiple matches:** Stop with error:
  > "Issue #<N> appears on multiple project boards. Cannot determine which to use."

- **Exactly one match:** Proceed. Store the following values:
  - `item_id`
  - `project_id`
  - `project_number`
  - `project_name`

### Phase 4 — Get Status field options

```bash
gh project field-list <project_number> --owner <owner> --format json
```

Use `jq` to extract the Status field:

```bash
echo '<fields-json>' | jq '.fields[] | select(.name == "Status" and .type == "ProjectV2SingleSelectField")'
```

If no matching field found, stop with:

> "No Status field found in project '<project_name>'."

Store the `field_id` and the `options` array.

### Phase 5 — Find target status option

The target status name is provided as the second argument to the skill (e.g. `"Planning"`).

Use `jq` to perform a case-insensitive substring match against option names:

```bash
echo '<options-json>' | jq --arg target "<target_status_lower>" '[.[] | select(.name | ascii_downcase | contains($target))]'
```

- **No matches:** Stop with error listing available options:
  > "Status '<target_status>' not found in project '<project_name>'. Available: '<opt1>', '<opt2>', ..."

- **One or more matches:** Use the first match. Store the `id` as `option_id` and the `name` as `option_name`.

### Phase 6 — Execute the move

```bash
gh project item-edit \
  --project-id <project_id> \
  --id <item_id> \
  --field-id <field_id> \
  --single-select-option-id <option_id>
```

If the command fails (non-zero exit code), stop with:

> "Failed to move issue #<N>: <error from stderr>"

On success, report:

> "Moved issue #<N> to '<option_name>' in project '<project_name>'."

## Common Mistakes

- **Using `gh issue list` instead of `gh issue view`** — always use `gh issue view <N>` for single-issue lookups.
- **Not stripping `#` from issue numbers** — always strip leading `#` before using the number in `gh` commands.
- **Calling `git remote` in GitHub Actions** — if `GITHUB_REPOSITORY` is missing in GHA, stop with an error. Do not call `git remote get-url origin`.
- **Not checking all projects** — the issue might be on any of the owner's project boards. Check all of them before declaring "not found".
- **Case-sensitive status matching** — use case-insensitive substring matching to handle emoji-prefixed status names (e.g. `"Building"` matches `"🏗️ Building"`).
- **Using shell expansion syntax** — never use `${VARIABLE}` or any `${...}` form. Use `printenv VARIABLE` instead.
- **Proceeding after pending-review check** — if the label is present, stop immediately. Do not run any project board commands.
