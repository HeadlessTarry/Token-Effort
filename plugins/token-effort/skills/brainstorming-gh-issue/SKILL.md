---
name: brainstorming-gh-issue
description: Use when the user wants to brainstorm a GitHub issue, turn a rough idea into a design spec, or continue refining a previously brainstormed issue.
user-invocable: true
---

# Brainstorm a GitHub Issue

## Overview

Fetches a GitHub issue (title, body, and comments), injects the content as context, then invokes `superpowers:brainstorming` to run an interactive design session. After the user approves the spec, posts it as a comment on the issue and applies the `pending-review` label.

**Usage:** `/brainstorming-gh-issue [<issue-number>]`

## When to Use

**Use when:**
- You want to brainstorm a GitHub issue and produce a design spec
- You want to continue refining a previously brainstormed issue (re-entry mode)

**Do not use when:**
- You want to brainstorm something not tied to a GitHub issue — use `superpowers:brainstorming` directly instead

## Prerequisites

The `gh` CLI must be authenticated and available in the session. All GitHub operations use `gh` commands via Bash. No MCP tools are used or required.

> **Important:** Do **not** use MCP tools (`mcp__plugin_github_github__*`) for any issue operation, even if they appear to be available.

> **Shell expansion:** Never use `${VARIABLE}` or any `${...}` form in bash commands. Claude Code's sandbox blocks these. Use `printenv VARIABLE` to read environment variables.

## Process

### Phase 1 — Resolve the issue

**Check args first:** If an issue number was provided as an argument (e.g. `/brainstorming-gh-issue 28` or `/brainstorming-gh-issue #28`), extract it and strip any leading `#`. That is the resolved issue number. Skip to Phase 2.

**If multiple issue numbers were passed as args** (e.g. `/brainstorming-gh-issue 28 29`), ask the user to choose exactly one before continuing:

> "I found multiple issue numbers: 28, 29. Which one should I brainstorm?"

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

> "No issue number found in args or branch name. Run as `/brainstorming-gh-issue <N>`."

### Phase 2 — Fetch context and detect state

Fetch the issue:

```bash
gh issue view <N> --json number,title,body,comments,labels
```

This returns a JSON object with `number`, `title`, `body`, `comments` (array of objects with `body` and `author`), and `labels` (array of objects with `name`).

**Check whether `pending-review` appears in the labels array:**

- **No `pending-review` label → fresh brainstorm.**
  Proceed to Phase 3 with the issue title, body, and comments as context. There is no prior spec.

- **Has `pending-review` label → re-entry mode.**
  Search all entries in the `comments` array for one whose `body` starts with the marker `<!-- brainstorming-gh-issue:spec -->`.

  - **Spec comment found:** extract the full body as the prior spec. This is a continuation — load both the issue context and the prior spec into Phase 3.
  - **No spec comment found** (label added manually): note "The `pending-review` label was present but no prior spec comment was found. Starting fresh." and proceed as a fresh brainstorm.

### Phase 3 — Handoff to `superpowers:brainstorming`

Format the issue context as follows:

```
## GitHub Issue #<N>: <title>

<body>

### Comments

**<author.login>:** <comment body>

**<author.login>:** <comment body>
```

If re-entry mode and a prior spec was found, append:

```
## Prior Design Spec

<prior spec body>
```

Inject this block into the conversation, then invoke `superpowers:brainstorming` with the following instructions:

- Treat the issue content above as the user's starting brief. Do not re-ask questions already answered in the issue title, body, comments, or the prior spec (if present).
- **Do NOT write or commit a spec file to disk.** The brainstorming skill's "Write design doc" step must be skipped entirely. After the user approves the design, hold the approved content in context — this skill resumes in Phase 4 to post it to GitHub.

Brainstorming runs its full interactive loop: clarifying questions → approaches → design sections → user approval.

After the user approves the design, proceed to Phase 4.

### Phase 4 — Post spec and apply label

#### Step 4a — Post spec as a GitHub comment

Take the approved design content and post it to the issue as a comment using this exact format:

```
<!-- brainstorming-gh-issue:spec -->
## 🤖🧠 Design Spec

<approved design content>

---
*AI-generated design spec. Mistakes do happen — please review carefully before approving.*

**To approve this spec:** remove the `pending-review` label and move the issue to the next status on the project board.
```

Run:

```bash
gh issue comment <N> --body "<formatted spec>"
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

> "Done. Spec posted to issue #<N> and labelled `pending-review`."

## Common Mistakes

- **Using MCP tools for issue operations** — all issue interactions must use `gh` CLI commands. Never call any `mcp__plugin_github_github__*` tool, even if it is available.
- **Writing the spec file to disk** — the brainstorming skill's file-write and commit steps must be skipped. The spec goes to GitHub as a comment, not to `docs/superpowers/specs/`. Do not run `git add` or `git commit` at any point.
- **Posting the spec before the user approves it** — Phase 4 must not run until the user has explicitly approved the design within the brainstorming session. Do not call `gh issue comment` or `gh issue edit` during Phase 3.
- **Forgetting the HTML comment marker** — the spec comment must begin with `<!-- brainstorming-gh-issue:spec -->` on its own line so future re-entry runs can locate it reliably.
- **Creating `pending-review` without checking first** — always run `gh label list` before `gh label create` to avoid an error if the label already exists.
- **Re-asking questions answered in the issue** — the issue title, body, and comments are the starting brief. Instruct brainstorming not to repeat questions already answered there.
- **Using shell expansion syntax** — never use `${VARIABLE}`, `${VARIABLE:-}`, or any `${...}` form. Claude Code's sandbox blocks these. Use `printenv VARIABLE` to read environment variables.
- **Asking the user to choose when no choice is needed** — branch name auto-detection always uses the first integer. Only ask the user to choose when multiple numbers were explicitly provided as arguments.

## Eval

- [ ] Resolved a single issue number from args (with or without `#` prefix) without calling `git branch --show-current`
- [ ] When no args given: called `git branch --show-current` and extracted the first integer from the branch name
- [ ] When no args given and branch has no digits: stopped with a message containing the suggested invocation `/brainstorming-gh-issue <N>`
- [ ] When multiple issue numbers given as args: asked the user to choose one before fetching any issue
- [ ] Fetched the issue with `gh issue view --json number,title,body,comments,labels`
- [ ] Identified the absence of `pending-review` label and proceeded as a fresh brainstorm
- [ ] Identified the presence of `pending-review` label and searched comments for `<!-- brainstorming-gh-issue:spec -->`
- [ ] In re-entry mode with spec found: loaded both issue context and prior spec into Phase 3
- [ ] In re-entry mode with no spec found: noted the absence and proceeded as a fresh brainstorm without erroring
- [ ] The Phase 3 handoff explicitly instructed brainstorming to skip writing/committing the spec file
- [ ] The Phase 3 handoff instructed brainstorming not to re-ask questions answered in the issue or prior spec
- [ ] `superpowers:brainstorming` was invoked (not re-implemented inline)
- [ ] `gh issue comment` was NOT called until after the user approved the design
- [ ] `gh issue edit --add-label pending-review` was NOT called until after user approval
- [ ] The spec comment body starts with `<!-- brainstorming-gh-issue:spec -->`
- [ ] The spec comment contains the heading `## 🤖🧠 Design Spec`
- [ ] The spec comment footer contains "Mistakes do happen"
- [ ] The spec comment footer contains instructions to remove `pending-review` and advance the project status
- [ ] `gh label list` was called before attempting to create or apply `pending-review`
- [ ] `gh label create "pending-review"` was called only when the label was absent from `gh label list` output
- [ ] `gh issue edit <N> --add-label "pending-review"` was called after the spec comment was posted
- [ ] No file was written to `docs/superpowers/specs/` or any other path on disk
- [ ] No `git add` or `git commit` was run
- [ ] No `mcp__` tool was called at any point
- [ ] A completion message was shown after Phase 4, referencing the issue number
