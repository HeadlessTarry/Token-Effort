---
name: building-gh-issue
description: Use when implementing a GitHub issue end-to-end — from approved design spec through planning, building, review, and PR.
user-invocable: true
---

# 🏗️ Build a GitHub Issue

## Overview

Implements a GitHub issue end-to-end: fetches the issue and its approved design spec, moves the issue to **Building** status, invokes an interactive planning session via `writing-plans`, then after user approval executes the plan via `subagent-driven-development`, runs verification and review, records decisions, and opens a pull request.

**Usage:** `/building-gh-issue [<issue-number>]`

## When to Use

**Use when:**
- A GitHub issue has an approved design spec comment (produced by `brainstorming-gh-issue`) and is ready to be planned and built
- You want a single command to handle plan → build → review → PR

**Do not use when:**
- The issue does not yet have a design spec comment — run `/brainstorming-gh-issue <N>` first and get the spec approved

## Prerequisites

The `gh` CLI must be authenticated and available in the session. All GitHub operations use `gh` commands via Bash. No MCP tools are used or required.

The following `superpowers` skills must be installed:
- `superpowers:writing-plans`
- `superpowers:subagent-driven-development`
- `superpowers:using-git-worktrees` (via subagent-driven-development)
- `superpowers:finishing-a-development-branch` (via subagent-driven-development)

> **Important:** Do **not** use MCP tools (`mcp__*`) for any issue operation, even if they appear to be available.

> **Shell expansion:** Never use `${VARIABLE}` or any `${...}` form in bash commands. Use `printenv VARIABLE` to read environment variables.

## Process

### Phase 1 — Resolve the issue

**Check args first:** If an issue number was provided as an argument (e.g. `/building-gh-issue 28` or `/building-gh-issue #28`), extract it and strip any leading `#`. That is the resolved issue number. Skip to Phase 2.

**If multiple issue numbers were passed as args** (e.g. `/building-gh-issue 28 29`), ask the user to choose exactly one before continuing:

> "I found multiple issue numbers: 28, 29. Which one should I build?"

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

> "No issue number found in args or branch name. Run as `/building-gh-issue <N>`."

### Phase 2 — Fetch context and validate spec

Fetch the issue:

```bash
gh issue view <N> --json number,title,body,comments,labels
```

This returns a JSON object with `number`, `title`, `body`, `comments` (array of objects with `body` and `author`), and `labels` (array of objects with `name`).

**Validate spec exists:** Search all entries in the `comments` array for one whose `body` starts with the marker `<!-- brainstorming-gh-issue:spec -->`. If no such comment is found, stop with:

> "No design spec found on issue #N. Please run `/brainstorming-gh-issue <N>` first and get the spec approved before building."

**Extract spec content:** Strip the `<!-- brainstorming-gh-issue:spec -->` marker line from the comment body. The remaining content is the spec context used in Phase 3.

### Phase 3 — Move to Building status

Invoke the `move-issue-status` skill with the issue number and status "Building".

If this fails for any reason (e.g. the issue is not on a project board, or the "Building" column does not yet exist), **log a warning and continue**. This step is non-fatal — do not block the build on a status update failure.

> ⚠️ Warning: could not move issue #N to Building status — continuing anyway.

### Phase 4 — Invoke `writing-plans` and execute

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

**Invoke the `writing-plans` skill** with the context block above and the following instructions:

- Treat the design spec as the approved input brief. Do not revisit or re-question decisions already captured in the spec.
- Run the full interactive planning loop through user approval.
- Do not make any git commits during planning.
- After the user approves the plan, invoke `subagent-driven-development` to execute it. Do not invoke `executing-plans` unless the plan has a single step touching only 1-2 files.
- Include this suppression instruction in the execution handoff: "Do not invoke `finishing-a-development-branch` — this will be handled by the calling skill after all review steps complete."

Wait for the full planning-and-execution cycle to complete. The `subagent-driven-development` skill handles worktree creation and branch management internally.

### Phase 5 — Verify (optional)

Attempt to invoke the project-local `/verify` skill.

If `/verify` is not available or not found, log the following named warning and continue:

> "⚠️ Phase 5 skipped: `/verify` skill not available in this project"

Do not block on this phase.

### Phase 6 — Code review

Invoke: `reviewing-code-systematically`

Address any `BLOCK` or `NEEDS_CHANGES` findings before continuing to Phase 7.

### Phase 7 — Record decisions

Invoke: `recording-decisions`

If the skill is not available, **stop immediately** with:

> "❌ Phase 7 blocked: `recording-decisions` skill is required but not available. Install the skill before continuing the build."

Do not proceed to Phase 8 until this phase completes successfully.

### Phase 8 — Commit and push local changes

If any of the above phases produced local changes (e.g. ADR files from `recording-decisions`), commit and push them:

```bash
git add -A
git commit -m "chore: post-build artifacts for issue #N"
git push
```

If there are no uncommitted changes, skip this phase with:

> "No local changes to commit."

### Phase 9 — Finish development branch

Invoke: `superpowers:finishing-a-development-branch`

This step creates the pull request. It runs exactly once, here, at the end of the build process. The execution skill in Phase 4 must not call it — that is what the suppression instruction in Phase 4 enforces.

## Common Mistakes

- **Using MCP tools for issue operations** — all issue interactions must use `gh` CLI commands. Never call any `mcp__*` tool, even if it is available.
- **Proceeding without a spec comment** — if `<!-- brainstorming-gh-issue:spec -->` is not found in the issue comments, abort immediately with the message to run `/brainstorming-gh-issue <N>` first. Do not start a planning session without an approved spec.
- **Blocking on the Building status move failure** — `move-issue-status` errors are non-fatal. Log the warning and continue. Never stop building because of a status update failure.
- **Not reading the plan file before posting** — if you need to reference the plan, locate it with `ls -t docs/superpowers/plans/*.md | head -1` and read it. Do not reconstruct the plan from memory.
- **Re-asking questions answered in the spec** — the design spec is the approved input brief. Instruct `writing-plans` not to revisit decisions already captured there.
- **Using shell expansion syntax** — never use `${VARIABLE}`, `${VARIABLE:-}`, or any `${...}` form. Use `printenv VARIABLE` to read environment variables.
- **Asking the user to choose when no choice is needed** — branch name auto-detection always uses the first integer. Only ask the user to choose when multiple numbers were explicitly provided as arguments.
- **Invoking `executing-plans` for non-trivial plans** — the default execution path is `subagent-driven-development`. Only use `executing-plans` when the plan has a single step touching 1-2 files.
- **Continuing past Phase 7 when `recording-decisions` is unavailable** — Phase 7 is a hard block. If the skill is not installed, stop with the error message. Do not warn and continue.
- **Calling `finishing-a-development-branch` inside the Phase 4 execution skill** — the PR creation step belongs at Phase 9 and only there. The suppression instruction in Phase 4 enforces this.
- **Silently skipping Phase 5** — Phase 5 is optional but must log a named warning when skipped. Do not silently continue without the warning.

## Eval

- [ ] Resolved a single issue number from args (with or without `#` prefix) without calling `git branch --show-current`
- [ ] When no args given: called `git branch --show-current` and extracted the first integer from the branch name
- [ ] When no args given and branch has no digits: stopped with a message containing the suggested invocation `/building-gh-issue <N>`
- [ ] When multiple issue numbers given as args: asked the user to choose one before fetching any issue
- [ ] Fetched the issue with `gh issue view --json number,title,body,comments,labels`
- [ ] Searched comments for `<!-- brainstorming-gh-issue:spec -->` marker
- [ ] Blocked with clear error when spec comment not found
- [ ] Extracted spec content with the marker line stripped
- [ ] Invoked `move-issue-status <N> "Building"` before invoking writing-plans
- [ ] Phase 3 status-move failure logged as a warning and did not block the build
- [ ] `writing-plans` was invoked (not re-implemented inline)
- [ ] The Phase 4 handoff instructed writing-plans not to re-question decisions captured in the spec
- [ ] The Phase 4 handoff instructed writing-plans not to make git commits
- [ ] The Phase 4 handoff specified `subagent-driven-development` as the default execution path after plan approval
- [ ] The Phase 4 handoff included the suppression instruction for `finishing-a-development-branch`
- [ ] Attempted `/verify` and skipped with named warning if absent
- [ ] Invoked `reviewing-code-systematically` and addressed BLOCK/NEEDS_CHANGES findings
- [ ] Invoked `recording-decisions` and blocked with error message if not available
- [ ] Did not proceed past Phase 7 when `recording-decisions` was unavailable
- [ ] Committed and pushed local changes if any were produced; skipped with message if none
- [ ] Invoked `superpowers:finishing-a-development-branch` exactly once, at Phase 9
- [ ] `finishing-a-development-branch` was NOT called by the execution skill in Phase 4
- [ ] No `mcp__` tool was called at any point
