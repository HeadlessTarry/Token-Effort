---
name: triaging-gh-issue
description: Use when triaging a single GitHub issue — classifying as enhancement, bug, documentation, or duplicate, applying labels with confidence scoring, and posting a triage summary comment.
---

# GitHub Issue Triage

## Overview

Fetches a single GitHub issue, classifies it by reading its content and searching for duplicates, then applies a label and posts a triage summary comment. When `GITHUB_ACTIONS` is set, applies changes immediately. Otherwise, shows the proposed label and waits for confirmation before applying any writes.

> **Note:** Status advancement is not part of triage. Each downstream skill (e.g. `brainstorming-gh-issue`, `planning-gh-issue`, `building-gh-issue`) is responsible for pulling the issue into its own project board column when it begins.

## When to Use

**Use when:**
- You want to triage a single GitHub issue — labelling it or correcting an existing label
- Running automatically in GitHub Actions when a new issue is opened

**Do not use when:**
- You want to triage many issues in a single batch — run the skill once per issue instead

## Prerequisites

The `gh` CLI must be authenticated and available in the session. All GitHub issue operations use `gh` commands via `Bash`.

## Labels

| Label | When to assign |
|-------|---------------|
| `enhancement` | A request for new behaviour, a new feature, or an improvement to existing functionality |
| `bug` | A report of something that is broken, not working as expected, or producing an error |
| `documentation` | A request for new or improved documentation, or a report that docs are wrong/missing |
| `duplicate` | Substantially the same issue already exists (open or closed) |

Assign exactly one label per issue. When an issue could fit multiple labels, choose the most specific match: `duplicate` takes precedence over all others; otherwise prefer the label that best describes the primary request.

## Process

### Phase 1 — Resolve issue number and repository

**Resolve the issue number:**

1. If an issue number was provided as an argument (e.g. `42` or `#42`), extract it and strip any leading `#`. That is the resolved issue number. Do not call `git branch --show-current`.

2. If no argument was provided and `GITHUB_ACTIONS` is set (non-empty), extract the issue number from the GitHub event payload:

```bash
printenv GITHUB_EVENT_PATH
```

Then read the JSON at that path and extract `issue.number`. If `GITHUB_EVENT_PATH` is not set or the JSON lacks `issue.number`, proceed to step 3.

3. If neither args nor event payload yielded a number, run:

```bash
git branch --show-current
```

Extract the **first** sequence of digits from the branch name. Examples:
- `42-some-feature` → `42`
- `feature/42-foo` → `42`
- `fix/42` → `42`

If none of the above yield a number, stop with:

> "No issue number found in args, event payload, or branch name. Provide an issue number as an argument."

**Resolve the repository:**

**If running in GitHub Actions** (`GITHUB_ACTIONS` is set and non-empty):

```bash
printenv GITHUB_REPOSITORY
```

This is always set by GitHub Actions in the format `owner/repo`. Split on `/` to extract owner and repo. If empty or absent, stop with:

> "I could not determine the GitHub repository: the `GITHUB_REPOSITORY` environment variable is not set. Please check your workflow configuration."

Do NOT call `git remote get-url origin` as a fallback.

**Otherwise** (interactive session):

```bash
git remote get-url origin
```

Parse owner and repo from:
- `https://github.com/<owner>/<repo>.git` → strip `.git`, split on `/`
- `git@github.com:<owner>/<repo>.git` → strip `.git`, split on `:`

If it fails or cannot be parsed, stop and ask: "I could not determine the GitHub repository from `git remote get-url origin`. Please provide the owner/repo (e.g. `acme/my-repo`)."

### Phase 2 — Fetch the issue

```bash
gh issue view <N> --json number,title,body,labels
```

Read existing labels for context. Always proceed to Phase 3 regardless — an existing label may be incorrect and needs overwriting.

### Phase 3 — Classify

#### Step 3a — Search for duplicates

```bash
gh search issues "<first 10–12 significant words of title and description>" --repo <owner>/<repo> --state all --json number,title --limit 20
```

An issue is a duplicate if the title and description are substantially the same as this issue AND the matching issue has a different number. If the search fails, treat as no duplicate found and continue.

#### Step 3b — Determine the classification

Apply the label rules in precedence order:

1. If a duplicate was found → assign `duplicate`, record the matching issue number
2. Else if the title/body describes something broken, not working, or producing an error → assign `bug`
3. Else if the title/body asks for new or improved documentation → assign `documentation`
4. Else → assign `enhancement`

Record the assigned label and a one-sentence rationale.

#### Step 3c — Assign a confidence score

Assign a confidence percentage (0–100%):

**High confidence (> 80%):** unambiguous signal — crash report with stack trace, clearly phrased feature request, exact duplicate, clearly missing or wrong docs.

**Low confidence (≤ 80%):** ambiguous signal — vague title/body, could fit multiple labels, depends on unstated context.

### Phase 4 — Confirm (interactive only)

Check for GHA context:

```bash
printenv GITHUB_ACTIONS
```

- If non-empty → skip to Phase 5 (no confirmation required)
- If empty → display the proposed label, confidence score, and one-line rationale, then prompt:

```
Proposed triage for issue #<N>:
  Label: <label>
  Confidence: <N>%
  Rationale: <one sentence>

Apply these changes? (yes / no)
```

Wait for the user's response before proceeding.

- **yes** → proceed to Phase 5
- **no** → report "No changes applied. Triage discarded." and stop.

### Phase 5 — Apply label + post comment

**Apply label** (only if confidence ≥ 70%):

Note the current labels from Phase 2:
- If no supported label exists on the issue: `gh issue edit <N> --add-label "<label>"`
- If a different supported label exists: `gh issue edit <N> --remove-label "<old>" --add-label "<new>"`
- If the current label already matches the classified label: skip the label write (but still post the comment below)
- If confidence < 70%: skip the label write entirely (but still post the comment below)
- If the label write fails (e.g. permission error): log the error and still proceed to post the comment; reference the failure in the final triage output.

**Post comment** (always, for every issue — regardless of label action):

```bash
gh issue comment <N> --body "<!-- triaging-gh-issue:summary -->
## 🤖 Triage Summary

**Label applied:** \`<label>\`
**Confidence:** <N>%

**Reasoning:** <one-sentence rationale>

**Duplicate check:** <No substantially similar issues found. | Potential duplicate of #<M>: <title>.>"
```

If confidence < 70%, the Label applied line reads:

```
**Label applied:** none (low confidence — <N>%)
```

When reclassifying (removing an existing supported label and adding a new one), the `**Label applied:**` line must name the old label:

```
**Label applied:** `<new-label>` (was `<old-label>`)
```

After Phase 5 completes, report:

```
Triage complete:
- Issue #<N>: labelled `<label>` (<N>%)
```

Or if label was skipped due to low confidence:

```
Triage complete:
- Issue #<N>: no label applied (confidence <N>% — below threshold). Comment posted.
```

## Common Mistakes

- **Calling `gh issue list` instead of `gh issue view`** — always use `gh issue view <N>` for single-issue triage.
- **Calling `git branch --show-current` when args were provided** — only fall back to branch name when no args given.
- **Not posting the comment** — Phase 5 always posts a triage comment, even for first-time label applications.
- **Skipping the comment when confidence is low** — the comment is always posted; only the label write is skipped at < 70% confidence.
- **Skipping the comment when label already matches** — if the current label already matches, skip the label write but still post the comment.
- **Applying changes before confirmation in interactive context** — Phase 5 must not run until Phase 4 confirms (unless in GHA).
- **Omitting the `<!-- triaging-gh-issue:summary -->` marker** — the comment must start with this HTML comment on its own line.
- **Using old comment format** — do not use "**Label updated by automated triage**". Always use the `## 🤖 Triage Summary` format.
- **Using shell expansion syntax** — never use `${VARIABLE}` or any `${...}` form. Use `printenv VARIABLE` instead.
- **Falling back to `git remote` in GitHub Actions** — if `GITHUB_REPOSITORY` is missing in GHA, stop with an error. Do not call `git remote get-url origin`.
- **Omitting the old label on reclassify** — when replacing an existing supported label, the `**Label applied:**` line must include `(was \`<old-label>\`)`.

## Eval

- [ ] Phase 1 extracted issue number from args (with or without `#` prefix) without calling `git branch --show-current`
- [ ] Phase 1 extracted issue number from `GITHUB_EVENT_PATH` when running in GHA without args
- [ ] Phase 1 fell back to first integer in branch name when no args and no event payload available
- [ ] Phase 1 stopped with the suggested invocation when no issue number could be determined
- [ ] In GHA context: owner/repo resolved from `GITHUB_REPOSITORY` via `printenv`; `git remote` NOT called
- [ ] In GHA context: if `GITHUB_REPOSITORY` missing, stopped with error
- [ ] In interactive context: owner/repo resolved from `git remote get-url origin`
- [ ] `gh issue view <N>` was called (not `gh issue list`)
- [ ] `gh search issues` was called using the first 10–12 significant words of the title/description
- [ ] `duplicate` assigned when matching issue found; classification continued on search failure
- [ ] Exactly one label assigned
- [ ] Confidence score (0–100%) assigned
- [ ] In GHA: Phase 4 confirmation skipped via `printenv GITHUB_ACTIONS`; no `${...}` expansion used
- [ ] In interactive: proposed label, confidence, and rationale shown before any write
- [ ] In interactive: "no" response stopped execution with "No changes applied. Triage discarded."
- [ ] Label write skipped when confidence < 70%; comment still posted
- [ ] Label write skipped when current label already matches; comment still posted
- [ ] `gh issue comment` called with `<!-- triaging-gh-issue:summary -->` marker as the first line
- [ ] Triage summary comment always posted (including for first-time label applications)
- [ ] When reclassifying, `**Label applied:**` line includes `(was \`<old-label>\`)`
