# Per-Issue Triage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bulk-batch triage with per-issue triage triggered on `issues.opened` in GHA.

**Architecture:** Rewrite `triaging-gh-issues` to accept a single issue number (from args or branch name), classify it, and always post a triage summary comment. Update `init-plus` Step 3 workflow template to trigger on `issues.opened` with `workflow_dispatch` fallback, passing the issue number to the skill.

**Tech Stack:** Markdown (SKILL.md), YAML (GitHub Actions), GitHub CLI (`gh`)

---

## 📁 File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `plugins/workflow/skills/triaging-gh-issues/SKILL.md` | Full rewrite for per-issue triage |
| Modify | `plugins/initialise/skills/init-plus/SKILL.md` | Update Step 3 workflow template |
| Delete | `training/workflow/skills/triaging-gh-issues/no-open-issues.md` | Stale: bulk concept gone |
| Delete | `training/workflow/skills/triaging-gh-issues/pagination-multiple-pages.md` | Stale: bulk concept gone |
| Delete | `training/workflow/skills/triaging-gh-issues/mixed-scenarios.md` | Stale: multi-issue bulk scenario |
| Delete | `training/workflow/skills/triaging-gh-issues/ambiguous-label-no-change.md` | Stale: `no-change` with no comment is gone |
| Delete | `training/workflow/skills/triaging-gh-issues/correct-label-no-change.md` | Stale: comment always posted now |
| Modify | `training/workflow/skills/triaging-gh-issues/happy-path-new-issue-no-label.md` | Update for single-issue |
| Modify | `training/workflow/skills/triaging-gh-issues/comment-format-on-reclassify.md` | Update for new comment format |
| Modify | `training/workflow/skills/triaging-gh-issues/gha-context-no-confirmation.md` | Update: comment always posted |
| Modify | `training/workflow/skills/triaging-gh-issues/partial-write-failure.md` | Update for single-issue failure |
| Modify | `training/workflow/skills/triaging-gh-issues/interactive-context-confirmation.md` | Update for single-issue confirm |
| Modify | `training/workflow/skills/triaging-gh-issues/interactive-user-declines.md` | Update for single-issue |
| Modify | `training/workflow/skills/triaging-gh-issues/gha-phase4-no-shell-expansion.md` | Update: now Phase 4 confirm check |
| Create | `training/workflow/skills/triaging-gh-issues/phase1-resolve-from-args.md` | New: issue number from args |
| Create | `training/workflow/skills/triaging-gh-issues/comment-always-posted-on-new-label.md` | New: always-post-comment |
| Create | `training/workflow/skills/triaging-gh-issues/comment-includes-html-marker.md` | New: comment marker format |
| Modify | `training/initialise/skills/init-plus/step3-workflow-content-accuracy.md` | Update for new trigger + tools |

---

### Task 1: Delete stale bulk-only triaging-gh-issues training evals

**Files:**
- Delete: `training/workflow/skills/triaging-gh-issues/no-open-issues.md`
- Delete: `training/workflow/skills/triaging-gh-issues/pagination-multiple-pages.md`
- Delete: `training/workflow/skills/triaging-gh-issues/mixed-scenarios.md`
- Delete: `training/workflow/skills/triaging-gh-issues/ambiguous-label-no-change.md`
- Delete: `training/workflow/skills/triaging-gh-issues/correct-label-no-change.md`

- [ ] **Step 1: Delete the five stale eval files**

```bash
rm training/workflow/skills/triaging-gh-issues/no-open-issues.md
rm training/workflow/skills/triaging-gh-issues/pagination-multiple-pages.md
rm training/workflow/skills/triaging-gh-issues/mixed-scenarios.md
rm training/workflow/skills/triaging-gh-issues/ambiguous-label-no-change.md
rm training/workflow/skills/triaging-gh-issues/correct-label-no-change.md
```

- [ ] **Step 2: Verify the files are gone**

```bash
ls training/workflow/skills/triaging-gh-issues/
```

Expected: none of the five deleted files appear in the listing.

---

### Task 2: Add three new training evals for per-issue-specific scenarios

**Files:**
- Create: `training/workflow/skills/triaging-gh-issues/phase1-resolve-from-args.md`
- Create: `training/workflow/skills/triaging-gh-issues/comment-always-posted-on-new-label.md`
- Create: `training/workflow/skills/triaging-gh-issues/comment-includes-html-marker.md`

- [ ] **Step 1: Write phase1-resolve-from-args.md**

```markdown
## Scenario

The skill is invoked with the argument `#42` (with a leading `#`). The `GITHUB_ACTIONS`
environment variable is not set.

## Expected Behaviour

- The skill extracts `42` from the argument by stripping the `#` prefix.
- `gh issue view 42` is called immediately without calling `git branch --show-current`.

## Pass Criteria

- [ ] The issue number `42` is resolved from the argument, with `#` stripped.
- [ ] `gh issue view 42` is called.
- [ ] `git branch --show-current` is NOT called.
```

- [ ] **Step 2: Write comment-always-posted-on-new-label.md**

```markdown
## Scenario

One unlabelled open issue describes a clear feature request (new dark mode theme). The
skill runs in interactive context (`GITHUB_ACTIONS` not set). The user confirms the
proposed label. Classification confidence is 88%.

## Expected Behaviour

- The issue is classified as `enhancement`.
- `gh issue edit --add-label enhancement` is called to apply the label.
- `gh issue comment` is ALSO called to post a triage summary comment — even though this
  is a first-time label application, not a reclassification.

## Pass Criteria

- [ ] `gh issue edit --add-label` is called with label `enhancement`.
- [ ] `gh issue comment` is called exactly once for this issue.
- [ ] The comment body contains `## 🤖 Triage Summary`.
- [ ] The comment is posted after the label is applied.
```

- [ ] **Step 3: Write comment-includes-html-marker.md**

```markdown
## Scenario

One unlabelled open issue clearly describes a bug (a login crash). `GITHUB_ACTIONS=true`,
`GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`. Classification confidence is 92%.

## Expected Behaviour

- The label `bug` is applied via `gh issue edit`.
- A triage summary comment is posted whose body begins with the HTML marker
  `<!-- triaging-gh-issues:summary -->` on its own line.

## Pass Criteria

- [ ] `gh issue comment` is called for the issue.
- [ ] The comment body starts with `<!-- triaging-gh-issues:summary -->`.
- [ ] The comment includes `## 🤖 Triage Summary` as a heading.
- [ ] The comment includes a `**Label applied:**` line referencing `` `bug` ``.
- [ ] The comment includes a `**Confidence:**` line with a percentage.
- [ ] The comment includes a `**Reasoning:**` line.
- [ ] The comment includes a `**Duplicate check:**` line.
```

- [ ] **Step 4: Verify the three new files were created**

```bash
ls training/workflow/skills/triaging-gh-issues/phase1-resolve-from-args.md
ls training/workflow/skills/triaging-gh-issues/comment-always-posted-on-new-label.md
ls training/workflow/skills/triaging-gh-issues/comment-includes-html-marker.md
```

Expected: all three list without error.

---

### Task 3: Update seven existing triaging-gh-issues training evals

**Files:**
- Modify: `training/workflow/skills/triaging-gh-issues/happy-path-new-issue-no-label.md`
- Modify: `training/workflow/skills/triaging-gh-issues/comment-format-on-reclassify.md`
- Modify: `training/workflow/skills/triaging-gh-issues/gha-context-no-confirmation.md`
- Modify: `training/workflow/skills/triaging-gh-issues/partial-write-failure.md`
- Modify: `training/workflow/skills/triaging-gh-issues/interactive-context-confirmation.md`
- Modify: `training/workflow/skills/triaging-gh-issues/interactive-user-declines.md`
- Modify: `training/workflow/skills/triaging-gh-issues/gha-phase4-no-shell-expansion.md`

- [ ] **Step 1: Overwrite happy-path-new-issue-no-label.md (single-issue scenario)**

```markdown
## Scenario

Issue #10 is unlabelled and describes a button that crashes the app when clicked — clearly
a bug. The skill is invoked with argument `10`. `GITHUB_ACTIONS` is not set. The user
approves the proposed label when prompted.

## Expected Behaviour

- Issue #10 is fetched via `gh issue view 10`.
- The issue is classified as `bug` with high confidence (≥ 70%).
- A confirmation prompt is shown before any write.
- After user confirms, `gh issue edit --add-label bug` is called.
- `gh issue comment` is called to post the triage summary.

## Pass Criteria

- [ ] `gh issue view 10` is called (not `gh issue list`).
- [ ] The issue is classified as `bug`.
- [ ] A confirmation prompt is displayed before any write.
- [ ] `gh issue edit --add-label bug` is called after confirmation.
- [ ] `gh issue comment` is called exactly once.
- [ ] Triage output references issue #10.
```

- [ ] **Step 2: Overwrite comment-format-on-reclassify.md (new comment format)**

```markdown
## Scenario

Issue #7 is currently labelled `bug`. Its title is "Update the README with installation
steps" and its body asks for clearer setup documentation — clearly a documentation request,
not a bug. `GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`.

## Expected Behaviour

- The issue is classified as `documentation` with high confidence.
- `gh issue edit --remove-label bug --add-label documentation` is called.
- `gh issue comment` is called with the standard triage summary format.

## Pass Criteria

- [ ] `gh issue edit` removes `bug` and adds `documentation`.
- [ ] `gh issue comment` is called exactly once.
- [ ] The comment body starts with `<!-- triaging-gh-issues:summary -->`.
- [ ] The comment includes `## 🤖 Triage Summary` heading.
- [ ] The comment includes `**Label applied:** \`documentation\``.
- [ ] The comment includes a `**Confidence:**` line with a percentage.
- [ ] The comment includes a `**Reasoning:**` line.
- [ ] The comment includes a `**Duplicate check:**` line.
- [ ] The comment does NOT start with "**Label updated by automated triage**" (old format).
```

- [ ] **Step 3: Overwrite gha-context-no-confirmation.md (single issue, comment always posted)**

```markdown
## Scenario

Issue #5 is unlabelled and describes a request to add CSV export — clearly an enhancement.
`GITHUB_ACTIONS=true`, `GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`. Classification
confidence is 90%.

## Expected Behaviour

- Issue #5 is fetched and classified as `enhancement`.
- No confirmation table or user prompt is shown (GHA context).
- `gh issue edit --add-label enhancement` is called.
- `gh issue comment` IS called to post the triage summary comment.

## Pass Criteria

- [ ] No confirmation prompt or summary table is displayed.
- [ ] `gh issue edit --add-label enhancement` is called for issue #5.
- [ ] `gh issue comment` is called exactly once.
- [ ] The comment body starts with `<!-- triaging-gh-issues:summary -->`.
```

- [ ] **Step 4: Overwrite partial-write-failure.md (single-issue write failure)**

```markdown
## Scenario

Issue #9 is unlabelled and clearly describes a bug. `GITHUB_ACTIONS=true`,
`GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`. Classification confidence is 90%.
When `gh issue edit --add-label bug` is called, it returns a 403 Forbidden error.

## Expected Behaviour

- The skill attempts to apply the label and reports the failure.
- Despite the label write failing, the skill still attempts to post the triage comment.
- The failure is referenced in the final triage output.

## Pass Criteria

- [ ] `gh issue edit --add-label bug` is called and the 403 error is reported.
- [ ] `gh issue comment` is still called after the label write fails.
- [ ] The triage output references the write failure.
```

- [ ] **Step 5: Overwrite interactive-context-confirmation.md (single issue)**

```markdown
## Scenario

Issue #3 is unlabelled and describes a request for a new dark mode setting — clearly an
enhancement with 88% confidence. `GITHUB_ACTIONS` is not set. The user is prompted and
responds "yes".

## Expected Behaviour

- The proposed label, confidence score, and one-line rationale are displayed before any
  write.
- After the user confirms, `gh issue edit --add-label enhancement` is called.
- `gh issue comment` is then called to post the triage summary.

## Pass Criteria

- [ ] A confirmation prompt shows the proposed label (`enhancement`), confidence (≥ 70%),
  and a rationale before any `gh issue edit` call.
- [ ] Neither `gh issue edit` nor `gh issue comment` is called before the user responds.
- [ ] After "yes", `gh issue edit --add-label enhancement` is called.
- [ ] `gh issue comment` is called after the label write.
```

- [ ] **Step 6: Overwrite interactive-user-declines.md (single issue)**

```markdown
## Scenario

Issue #4 is unlabelled and describes a feature request. `GITHUB_ACTIONS` is not set.
Classification confidence is 85%. The user responds "no" to the confirmation prompt.

## Expected Behaviour

- A confirmation prompt is shown with the proposed label and rationale.
- The user responds "no".
- No writes occur: neither `gh issue edit` nor `gh issue comment` is called.
- The skill reports "No changes applied. Triage discarded." and stops.

## Pass Criteria

- [ ] A confirmation prompt is displayed before any write.
- [ ] After "no", `gh issue edit` is NOT called.
- [ ] After "no", `gh issue comment` is NOT called.
- [ ] The skill outputs a message indicating no changes were applied.
```

- [ ] **Step 7: Overwrite gha-phase4-no-shell-expansion.md (Phase 4 GHA check)**

```markdown
## Scenario

The skill is invoked in a GitHub Actions environment (`GITHUB_ACTIONS=true`,
`GITHUB_REPOSITORY=HeadlessTarry/Token-Effort`). After classifying the issue, the
skill must check GHA context in Phase 4 to decide whether to skip confirmation.

## Expected Behaviour

- The skill checks `GITHUB_ACTIONS` in Phase 4 using `printenv GITHUB_ACTIONS` — NOT
  any `${...}` form.
- The check succeeds and Phase 4 confirmation is skipped.
- Phase 5 writes proceed without a user prompt.

## Pass Criteria

- [ ] The bash command used in Phase 4 does NOT contain `${` shell expansion syntax.
- [ ] `printenv GITHUB_ACTIONS` (or an equivalent expansion-free command) is used.
- [ ] No confirmation prompt is shown.
- [ ] Phase 5 writes (`gh issue edit`, `gh issue comment`) proceed without user input.
```

- [ ] **Step 8: Verify all seven eval files start with "## Scenario"**

```bash
for f in happy-path-new-issue-no-label comment-format-on-reclassify gha-context-no-confirmation partial-write-failure interactive-context-confirmation interactive-user-declines gha-phase4-no-shell-expansion; do
  head -1 "training/workflow/skills/triaging-gh-issues/${f}.md"
done
```

Expected: each line prints `## Scenario`.

---

### Task 4: Rewrite triaging-gh-issues/SKILL.md

**Files:**
- Modify: `plugins/workflow/skills/triaging-gh-issues/SKILL.md`

- [ ] **Step 1: Write the new SKILL.md content**

Full content to write to `plugins/workflow/skills/triaging-gh-issues/SKILL.md`:

````markdown
---
name: triaging-gh-issues
description: Use when the user wants to triage a GitHub issue in the current repository — labelling unlabelled issues and correcting obviously wrong labels. Also runs automatically via GitHub Actions when a new issue is opened.
user-invocable: true
---

# GitHub Issue Triage

## Overview

Fetches a single GitHub issue, classifies it by reading its content and searching for duplicates, then applies a label and posts a triage summary comment. In interactive sessions, shows the proposed label and waits for confirmation before applying any writes. In GitHub Actions, applies changes immediately.

> **Note:** Status advancement is not part of triage. Each downstream skill (e.g. `brainstorming-gh-issue`, `planning-gh-issue`, `building-gh-issue`) is responsible for pulling the issue into its own project board column when it begins.

**Usage:** `/triaging-gh-issues [<issue-number>]`

## When to Use

**Use when:**
- You want to triage a single GitHub issue — labelling it or correcting an existing label
- Running automatically in GitHub Actions when a new issue is opened

**Do not use when:**
- You want to triage many issues in a single batch — run the skill once per issue instead

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

### Phase 1 — Resolve issue number and repository

**Resolve the issue number:**

If an issue number was provided as an argument (e.g. `/triaging-gh-issues 42` or `/triaging-gh-issues #42`), extract it and strip any leading `#`. That is the resolved issue number. Do not call `git branch --show-current`.

If no argument was provided, run:

```bash
git branch --show-current
```

Extract the **first** sequence of digits from the branch name. Examples:
- `42-some-feature` → `42`
- `feature/42-foo` → `42`
- `fix/42` → `42`

If neither args nor branch name yields a number, stop with:

> "No issue number found in args or branch name. Run as `/triaging-gh-issues <N>`."

**Resolve the repository:**

**If running in GitHub Actions** (`GITHUB_ACTIONS` is set and non-empty):

```bash
printenv GITHUB_ACTIONS
```

If non-empty, read:

```bash
printenv GITHUB_REPOSITORY
```

This is always set by GitHub Actions in the format `owner/repo`. Split on `/` to extract owner and repo. If empty or absent, stop with:

> "I could not determine the GitHub repository: the `GITHUB_REPOSITORY` environment variable is not set. Please check your workflow configuration."

Do NOT call `git remote get-url origin` as a fallback.

**Otherwise** (interactive / local session):

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
gh search issues "<first 10–12 significant words of title and description>" --repo OWNER/REPO --state all --json number,title --limit 20
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

### Phase 4 — Confirm (local only)

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

**Post comment** (always, for every issue — regardless of label action):

```bash
gh issue comment <N> --body "<!-- triaging-gh-issues:summary -->
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
- **Omitting the `<!-- triaging-gh-issues:summary -->` marker** — the comment must start with this HTML comment on its own line.
- **Using old comment format** — do not use "**Label updated by automated triage**". Always use the `## 🤖 Triage Summary` format.
- **Using shell expansion syntax** — never use `${VARIABLE}` or any `${...}` form. Use `printenv VARIABLE` instead.
- **Using MCP tools** — all issue operations must use `gh` CLI commands.
- **Falling back to `git remote` in GitHub Actions** — if `GITHUB_REPOSITORY` is missing in GHA, stop with an error. Do not call `git remote get-url origin`.

## Eval

- [ ] Phase 1 extracted issue number from args (with or without `#` prefix) without calling `git branch --show-current`
- [ ] Phase 1 fell back to first integer in branch name when no args provided
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
- [ ] `gh issue comment` called with `<!-- triaging-gh-issues:summary -->` marker as the first line
- [ ] Triage summary comment always posted (including for first-time label applications)
- [ ] No `mcp__` tool called
- [ ] No `${...}` shell expansion used
````

- [ ] **Step 2: Verify the rewritten SKILL.md frontmatter and key phrases**

```bash
head -10 plugins/workflow/skills/triaging-gh-issues/SKILL.md
```

Expected: frontmatter with `name: triaging-gh-issues`, `user-invocable: true`, and title `# GitHub Issue Triage`.

```bash
grep -c "gh issue view" plugins/workflow/skills/triaging-gh-issues/SKILL.md
```

Expected: at least 1 (Phase 2 command).

```bash
grep "gh issue list" plugins/workflow/skills/triaging-gh-issues/SKILL.md
```

Expected: zero matches (the old bulk command must not appear outside the Common Mistakes section).

- [ ] **Step 3: Commit triaging eval + skill changes**

```bash
git add training/workflow/skills/triaging-gh-issues/ plugins/workflow/skills/triaging-gh-issues/SKILL.md
git commit -m "feat: rewrite triaging-gh-issues for per-issue triage"
```

---

### Task 5: Update init-plus/SKILL.md Step 3 workflow template

**Files:**
- Modify: `plugins/initialise/skills/init-plus/SKILL.md`

Three targeted changes inside the `Write .github/workflows/triaging-gh-issues.yml:` block:
1. Replace `on: schedule/workflow_dispatch` with `on: issues: types: [opened]` + `workflow_dispatch` with `issue_number` input
2. Change prompt body from "Triage all open issues..." to "Triage issue #${{ github.event.issue.number || inputs.issue_number }}."
3. In `claude_args allowedTools`: remove `Bash(gh issue list *)`, add `Bash(git branch --show-current)`

- [ ] **Step 1: Replace the `on:` trigger block**

Find and replace in `plugins/initialise/skills/init-plus/SKILL.md`:

Old:
```yaml
on:
  schedule:
    - cron: '0 4 * * 1'
  workflow_dispatch:
```

New:
```yaml
on:
  issues:
    types: [opened]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to triage'
        required: true
        type: number
```

- [ ] **Step 2: Replace the prompt body**

Old:
```
            Use the `token-effort-workflow:triaging-gh-issues` skill.
            Triage all open issues in this repository.
```

New:
```
            Use the `token-effort-workflow:triaging-gh-issues` skill.
            Triage issue #${{ github.event.issue.number || inputs.issue_number }}.
```

- [ ] **Step 3: Replace the allowedTools line**

Old:
```
            --allowedTools Skill,Bash(printenv *),Bash(git remote get-url *),Bash(gh issue list *),Bash(gh issue view *),Bash(gh search issues *),Bash(gh issue edit *),Bash(gh issue comment *)
```

New:
```
            --allowedTools Skill,Bash(printenv *),Bash(git remote get-url *),Bash(git branch --show-current),Bash(gh issue view *),Bash(gh search issues *),Bash(gh issue edit *),Bash(gh issue comment *)
```

- [ ] **Step 4: Verify the three changes are correct**

```bash
grep -n "issues:" plugins/initialise/skills/init-plus/SKILL.md | head -5
```

Expected: a line containing `issues:` inside the workflow YAML block.

```bash
grep "issue_number" plugins/initialise/skills/init-plus/SKILL.md | head -3
```

Expected: at least one match for the `workflow_dispatch` input definition.

```bash
grep "gh issue list" plugins/initialise/skills/init-plus/SKILL.md
```

Expected: zero matches (removed from allowedTools).

```bash
grep "git branch --show-current" plugins/initialise/skills/init-plus/SKILL.md
```

Expected: at least one match (added to allowedTools).

---

### Task 6: Update init-plus step3-workflow-content-accuracy training eval

**Files:**
- Modify: `training/initialise/skills/init-plus/step3-workflow-content-accuracy.md`

- [ ] **Step 1: Overwrite the eval**

```markdown
## Scenario
The user selects "3", confirms prerequisites, no existing workflow file. The skill writes
.github/workflows/triaging-gh-issues.yml.

## Expected Behavior
The written workflow file must match the template defined in the skill exactly, including
the correct action versions, trigger (issues.opened + workflow_dispatch with issue_number
input), allowedTools list, and prompt text.

## Pass Criteria
- [ ] Workflow name is "Triage GitHub Issues"
- [ ] Trigger is `on: issues: types: [opened]` (not a cron schedule)
- [ ] `workflow_dispatch` has an `issue_number` input with `required: true` and `type: number`
- [ ] Uses anthropics/claude-code-action@v1
- [ ] Uses actions/create-github-app-token@v3
- [ ] References vars.PROJECT_MANAGER_CLIENT_ID and secrets.PROJECT_MANAGER_PRIVATE_KEY
- [ ] References secrets.CLAUDE_CODE_OAUTH_TOKEN
- [ ] plugin_marketplaces includes HeadlessTarry/Token-Effort.git
- [ ] Prompt instructs to use token-effort-workflow:triaging-gh-issues
- [ ] Prompt passes the issue number: `#${{ github.event.issue.number || inputs.issue_number }}`
- [ ] allowedTools includes Skill and required Bash permissions
- [ ] allowedTools includes Bash(git branch --show-current)
- [ ] allowedTools does NOT include Bash(gh issue list *)
- [ ] claude_args includes --model sonnet
- [ ] Prompt block includes the GITHUB_STEP_SUMMARY write pattern
```

- [ ] **Step 2: Verify the eval was written**

```bash
head -3 training/initialise/skills/init-plus/step3-workflow-content-accuracy.md
```

Expected: starts with `## Scenario`.

- [ ] **Step 3: Commit init-plus changes**

```bash
git add plugins/initialise/skills/init-plus/SKILL.md training/initialise/skills/init-plus/step3-workflow-content-accuracy.md
git commit -m "feat: update init-plus to generate per-issue triage workflow"
```
