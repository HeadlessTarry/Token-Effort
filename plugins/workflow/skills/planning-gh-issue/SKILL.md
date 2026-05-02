---
name: planning-gh-issue
description: Use when the user wants to write an implementation plan for a GitHub issue and post it for review.
user-invocable: true
---

# 📋 Plan a GitHub Issue

## 🌐 Overview

Fetches a GitHub issue and its approved design spec, moves the issue to **Planning** status, then invokes `superpowers:writing-plans` to run an interactive planning session. After the user approves the plan, posts it as a comment on the issue and applies the `pending-review` label.

**Usage:** `/token-effort-workflow:planning-gh-issue [<issue-number>]`

## ⚙️ When to Use

**Use when:**
- A GitHub issue has an approved design spec comment (produced by `token-effort-workflow:brainstorming-gh-issue`) and is ready to be planned
- You want to continue refining a previously written plan (re-entry mode)

**Do not use when:**
- The issue does not yet have a design spec comment — run `/token-effort-workflow:brainstorming-gh-issue <N>` first and get the spec approved
- You want to plan something not tied to a GitHub issue — use `superpowers:writing-plans` directly instead

## Prerequisites

The `gh` CLI must be authenticated and available in the session. All GitHub operations use `gh` commands via Bash. No MCP tools are used or required.

The following `superpowers` skill must be installed:
- `superpowers:writing-plans`

> **Important:** Do **not** use MCP tools (`mcp__plugin_github_github__*`) for any issue operation, even if they appear to be available.

> **Shell expansion:** Never use `${VARIABLE}` or any `${...}` form in bash commands. Claude Code's sandbox blocks these. Use `printenv VARIABLE` to read environment variables.

## Process

### Phase 1 — Resolve the issue

**Check args first:** If an issue number was provided as an argument (e.g. `/planning-gh-issue 28` or `/planning-gh-issue #28`), extract it and strip any leading `#`. That is the resolved issue number. Skip to Phase 2.

**If multiple issue numbers were passed as args** (e.g. `/planning-gh-issue 28 29`), ask the user to choose exactly one before continuing:

> "I found multiple issue numbers: 28, 29. Which one should I plan?"

Wait for the user's response. Use the chosen number. Do not fetch any issue until the user has selected one.

**Auto-detect from branch:** If no args were provided, run:

```bash
git branch --show-current
```

Extract the **first** sequence of digits from the branch name. Examples:
- `28-some-feature` → `28`
- `feature/28-foo` → `28`
- `fix/28` → `28`
- `28-29-migrate-auth` → `28` (first only; do not ask the user to choose)
- `main` → no match

**If no issue number can be determined** (no args, and no digits in the branch name), stop with:

> "No issue number found in args or branch name. Run as `/token-effort-workflow:planning-gh-issue <N>`."

### Phase 2 — Fetch context and detect state

Fetch the issue:

```bash
gh issue view <N> --json number,title,body,comments,labels
```

This returns a JSON object with `number`, `title`, `body`, `comments` (array of objects with `body` and `author`), and `labels` (array of objects with `name`).

**Validate spec exists:** Search all entries in the `comments` array for one whose `body` starts with the marker `<!-- brainstorming-gh-issue:spec -->`. If no such comment is found, stop with:

> "No design spec found on issue #N. Please run `/token-effort-workflow:brainstorming-gh-issue #N` first and get the spec approved before planning."

**Extract spec content:** Strip the `<!-- brainstorming-gh-issue:spec -->` marker line from the comment body. The remaining content is the spec context used in Phase 3.

**Detect re-entry:** Search all entries in the `comments` array for one whose `body` starts with `<!-- token-effort-workflow:planning-gh-issue -->`:

- **No plan comment → fresh planning run.** Proceed to Phase 3 with issue context and spec content. There is no prior plan.
- **Plan comment found → re-entry mode.** Strip the `<!-- token-effort-workflow:planning-gh-issue -->` marker line and extract the prior plan body. Load both the issue context, the spec content, and the prior plan into Phase 3 as a continuation.

### Phase 3 — Move to Planning and invoke `superpowers:writing-plans`

**Move issue to Planning status:**

Invoke `token-effort-workflow:move-issue-status <N> "Planning"`.

If this fails for any reason (e.g. the issue is not on a project board, or the "Planning" column does not yet exist), **log a warning and continue**. This step is non-fatal — do not block the planning session on a status update failure.

> ⚠️ Warning: could not move issue #N to Planning status — continuing anyway.

**Format context block:**

```
## GitHub Issue #<N>: <title>

<body>

### Comments

**<author.login>:** <comment body>

**<author.login>:** <comment body>

## Design Spec

<spec content (marker line stripped)>
```

If re-entry mode and a prior plan was found, append:

```
## Prior Implementation Plan

<prior plan body (marker line stripped)>
```

**Invoke `superpowers:writing-plans`** with the context block above and the following instructions:

- Treat the design spec as the approved input brief. Do not revisit or re-question decisions already captured in the spec.
- Run the full interactive planning loop through user approval.
- Do not make any git commits — the plan content will be posted to GitHub as a comment after approval.
- After the user approves the plan, do **not** call `superpowers:subagent-driven-development`, `superpowers:executing-plans` or any other build/execution skill. Proceed to Phase 4 of this skill instead.

Wait for the user to approve the plan. Do not proceed to Phase 4 until approval is given.

### Phase 4 — Post plan and apply label

#### Pre-step — Locate and read the plan file

`superpowers:writing-plans` will have written the approved plan to `~/.claude/plans/`. Find the most recently created file:

```bash
ls -t ~/.claude/plans/*.md | head -1
```

Read the file content. Use this as the plan body in step 4a. Do **not** reconstruct the plan from memory.

#### Step 4a — Post plan as a GitHub comment

Post the plan to the issue using this exact format:

```
<!-- token-effort-workflow:planning-gh-issue -->
## 🤖📋 Implementation Plan

<approved plan content>

---
*AI-generated implementation plan. Please review carefully before approving.*

**To approve this plan:** remove the `pending-review` label and move the issue to the next status on the project board.
```

Run:

```bash
gh issue comment <N> --body "<formatted plan>"
```

#### Step 4b — Ensure the `pending-review` label exists

Run:

```bash
gh label list
```

If `pending-review` does not appear in the output, create it:

```bash
gh label create "pending-review" --color "#FEF2C0" --description "Spec posted, awaiting human approval"
```

#### Step 4c — Apply the label

```bash
gh issue edit <N> --add-label "pending-review"
```

After Phase 4 completes, report:

> "Done. Implementation plan posted to issue #<N> and labelled `pending-review`."

## Common Mistakes

- **Using MCP tools for issue operations** — all issue interactions must use `gh` CLI commands. Never call any `mcp__plugin_github_github__*` tool, even if it is available.
- **Proceeding without a spec comment** — if `<!-- brainstorming-gh-issue:spec -->` is not found in the issue comments, abort immediately with the message to run `/token-effort-workflow:brainstorming-gh-issue #N` first. Do not start a planning session without an approved spec.
- **Blocking on the Planning status move failure** — `token-effort-workflow:move-issue-status` errors are non-fatal. Log the warning and continue. Never stop planning because of a status update failure.
- **Posting the plan before the user approves it** — Phase 4 must not run until the user has explicitly approved the plan within the `superpowers:writing-plans` session. Do not call `gh issue comment` or `gh issue edit` during Phase 3.
- **Not reading the plan file before posting** — always locate and read the file that writing-plans wrote with `ls -t ~/.claude/plans/*.md | head -1`. Do not reconstruct the plan content from memory.
- **Forgetting the HTML comment marker** — the plan comment must begin with `<!-- token-effort-workflow:planning-gh-issue -->` on its own line so future re-entry runs can locate it reliably.
- **Invoking execution skills after plan approval** — the Phase 3 handoff instructs writing-plans to stop after the user approves the plan. Do not invoke `superpowers:subagent-driven-development`, `superpowers:executing-plans` or any build skill; proceed to Phase 4 instead.
- **Creating `pending-review` without checking first** — always run `gh label list` before `gh label create` to avoid an error if the label already exists.
- **Re-asking questions answered in the spec** — the design spec is the approved input brief. Instruct writing-plans not to revisit decisions already captured there.
- **Using shell expansion syntax** — never use `${VARIABLE}`, `${VARIABLE:-}`, or any `${...}` form. Claude Code's sandbox blocks these. Use `printenv VARIABLE` to read environment variables.
- **Asking the user to choose when no choice is needed** — branch name auto-detection always uses the first integer. Only ask the user to choose when multiple numbers were explicitly provided as arguments.
- **Stripping the wrong marker line** — the spec comment starts with `<!-- brainstorming-gh-issue:spec -->` and the plan comment starts with `<!-- token-effort-workflow:planning-gh-issue -->`. Ensure you strip the correct marker for each.

## Eval

- [ ] Resolved a single issue number from args (with or without `#` prefix) without calling `git branch --show-current`
- [ ] When no args given: called `git branch --show-current` and extracted the first integer from the branch name
- [ ] When no args given and branch has no digits: stopped with a message containing the suggested invocation `/token-effort-workflow:planning-gh-issue <N>`
- [ ] When multiple issue numbers given as args: asked the user to choose one before fetching any issue
- [ ] Fetched the issue with `gh issue view --json number,title,body,comments,labels`
- [ ] Searched comments for `<!-- brainstorming-gh-issue:spec -->` marker
- [ ] Blocked with clear error when spec comment not found
- [ ] Extracted spec content with the marker line stripped
- [ ] Identified the absence of `<!-- token-effort-workflow:planning-gh-issue -->` comment and proceeded as a fresh planning run
- [ ] In re-entry mode: loaded prior plan content (marker stripped) into Phase 3 alongside issue context and spec
- [ ] Invoked `token-effort-workflow:move-issue-status <N> "Planning"` before invoking writing-plans
- [ ] Phase 3 status-move failure logged as a warning and did not block the planning session
- [ ] The Phase 3 handoff instructed writing-plans not to invoke execution skills after approval
- [ ] The Phase 3 handoff instructed writing-plans not to make git commits
- [ ] The Phase 3 handoff instructed writing-plans not to re-question decisions captured in the spec
- [ ] `superpowers:writing-plans` was invoked (not re-implemented inline)
- [ ] `gh issue comment` was NOT called until after the user approved the plan
- [ ] `gh issue edit --add-label pending-review` was NOT called until after user approval
- [ ] Phase 4 located the plan file with `ls -t ~/.claude/plans/*.md | head -1`
- [ ] Phase 4 read the plan file content before constructing the GitHub comment
- [ ] The plan comment body starts with `<!-- token-effort-workflow:planning-gh-issue -->`
- [ ] The plan comment contains the heading `## 🤖📋 Implementation Plan`
- [ ] The plan comment footer contains "Please review carefully before approving"
- [ ] The plan comment footer contains instructions to remove `pending-review` and advance the project status
- [ ] `gh label list` was called before attempting to create or apply `pending-review`
- [ ] `gh label create "pending-review"` was called only when the label was absent from `gh label list` output
- [ ] `gh issue edit <N> --add-label "pending-review"` was called after the plan comment was posted
- [ ] No `mcp__` tool was called at any point
- [ ] A completion message was shown after Phase 4, referencing the issue number
