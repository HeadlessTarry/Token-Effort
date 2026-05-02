---
name: building-gh-issue
description: Use when implementing a GitHub issue end-to-end — from approved design spec and implementation plan to merged PR.
user-invocable: true
---

# 🏗️ Build a GitHub Issue

## 🌐 Overview

Implements a GitHub issue end-to-end: fetches the issue, its approved design spec, and its approved implementation plan, moves the issue to "Building" status, executes the plan, verifies and reviews the result, and opens a pull request. The pull request is created exactly once, at the final phase.

**Usage:** `/token-effort-workflow:building-gh-issue <issue-number>`

Strip any leading `#` from the issue number before use (e.g. `#42` → `42`).

## ⚙️ When to Use

**Use when:**
- A GitHub issue has both an approved design spec comment (produced by `token-effort-workflow:brainstorming-gh-issue`) and an approved implementation plan comment (produced by `token-effort-workflow:planning-gh-issue`) and is ready to be implemented
- You want a structured, end-to-end build workflow from plan to merged PR

**Do not use when:**
- The issue does not yet have a design spec comment — run `/token-effort-workflow:brainstorming-gh-issue <N>` first and get the spec approved
- The issue does not yet have an implementation plan comment — run `/token-effort-workflow:planning-gh-issue <N>` first and get the plan approved
- Implementation is already underway on a branch — join that branch directly instead

## Prerequisites

- `gh` CLI must be authenticated and available in the session. All GitHub operations use `gh` commands via `Bash`. No MCP tools are used or required.
- The issue must have a design spec comment whose body begins with `<!-- brainstorming-gh-issue:spec -->`, produced by `token-effort-workflow:brainstorming-gh-issue`.
- The issue must have an implementation plan comment whose body begins with `<!-- token-effort-workflow:planning-gh-issue -->`, produced by `token-effort-workflow:planning-gh-issue`.
- The following `superpowers` skills must be installed:
  - `superpowers:executing-plans`
  - `superpowers:subagent-driven-development`
  - `superpowers:using-git-worktrees`
  - `superpowers:finishing-a-development-branch`

> **Important:** Do **not** use MCP tools (`mcp__plugin_github_github__*`) for any issue or GitHub operation.

## Process

### Phase 1 — Fetch issue, extract spec and plan

Run:

```bash
gh issue view <N> --json number,title,body,comments,labels
```

**Extract spec:** Search the `comments` array for a comment whose body starts with `<!-- brainstorming-gh-issue:spec -->`.

**If no spec comment is found:** Stop immediately with the error:

> "Issue #N does not have a design spec comment. Run `/token-effort-workflow:brainstorming-gh-issue <N>` to generate one, then get it approved before building."

**If found:** Extract the spec body — the full comment content **after** stripping the `<!-- brainstorming-gh-issue:spec -->` marker line.

**Extract plan:** Search the `comments` array for a comment whose body starts with `<!-- token-effort-workflow:planning-gh-issue -->`.

**If no plan comment is found:** Stop immediately with the error:

> "Issue #N does not have an implementation plan comment. Run `/token-effort-workflow:planning-gh-issue <N>` to generate one, then get it approved before building."

**If found:** Extract the plan body — the full comment content **after** stripping the `<!-- token-effort-workflow:planning-gh-issue -->` marker line. This is the plan used for execution in Phase 4.

### Phase 2 — Move issue to Building status

Invoke: `token-effort-workflow:move-issue-status <N> "Building"`

If this fails for any reason (e.g. the issue is not on a project board, or the skill is unavailable), **log a warning and continue**. This phase is non-fatal — do not block the build on a status update failure.

### Phase 3 — Create worktree

**Branch naming:** Derive the branch name from the issue data extracted in Phase 1:

1. Take the issue title.
2. Lowercase it.
3. Replace every run of non-alphanumeric characters with a single hyphen.
4. Strip any leading or trailing hyphens.
5. Truncate the resulting slug to 50 characters.
6. Strip any trailing hyphen introduced by the truncation cut.
7. Prepend the issue number: `<N>-<slug>`

Examples:
- Issue #98 "building-gh-issue commits directly to main — no worktree or branch created" → `98-building-gh-issue-commits-directly-to-main-no`
- Issue #55 "Add retry logic to the API client — handles 5xx errors" → `55-add-retry-logic-to-the-api-client-handles-5xx`

**Worktree creation:** Invoke `superpowers:using-git-worktrees` with the following context supplied in the prompt:

- **Worktree path:** `.claude/worktrees/<branch-name>`
- **Branch name:** `<branch-name>` (as derived above)
- **Instruction:** use the supplied path and branch name directly; skip the interactive directory-selection flow

This phase runs **unconditionally** — regardless of the branch that is currently checked out.

**This phase is fatal.** If `using-git-worktrees` fails for any reason, stop the build immediately with:

> "❌ Phase 3 blocked: `superpowers:using-git-worktrees` failed. Resolve the Git error above before retrying the build."

Do not log-and-continue.

### Phase 4 — Execute plan

Assess the plan extracted in Phase 1. Choose the execution skill:

| Skill | When to use |
|-------|-------------|
| `superpowers:subagent-driven-development` | **Default.** Use for most plans. |
| `superpowers:executing-plans` | Use **only** when the implementation plan (1) has a single step and (2) touches only 1-2 files. |

Invoke the chosen skill with the plan content injected as context, and the following **mandatory suppression instruction** included verbatim in the prompt:

> "Do not invoke `finishing-a-development-branch` — this will be handled by the calling skill after all review steps complete."

This instruction is required regardless of which execution skill is chosen. Do not paraphrase or omit it.

### Phase 5 — Verify (optional)

Attempt to invoke the project-local `/verify` skill.

If `/verify` is not available or not found, log the following named warning and continue:

> "⚠️ Phase 5 skipped: `/verify` skill not available in this project"

Do not block on this phase.

### Phase 6 — Inline simplify pass

Review all changed code directly using Claude's built-in reasoning. No separate skill invocation is needed.

Check for:
- Unnecessary duplication
- Opportunities to reuse existing utilities
- Over-engineering
- Efficiency issues

Fix any issues found directly. Report a brief summary of changes made, or "No changes needed" if nothing required fixing.

### Phase 7 — Code review

Invoke: `token-effort-workflow:reviewing-code-systematically`

Address any `BLOCK` or `NEEDS_CHANGES` findings before continuing to Phase 8.

### Phase 8 — Inline security review

Review all changed code directly using Claude's built-in reasoning. No separate skill invocation is needed.

Check for:
- Injection vulnerabilities
- Insecure credential handling
- Exposed secrets
- Unsafe shell expansion
- OWASP Top 10 concerns relevant to the changes

Fix any issues found directly. Report a brief summary of findings, or "No security issues found" if the review was clean.

### Phase 9 — Record decisions

Invoke: `token-effort-workflow:recording-decisions`

If the skill is not available, **stop immediately** with:

> "❌ Phase 9 blocked: `token-effort-workflow:recording-decisions` skill is required but not available.
>  Install the skill before continuing the build."

Do not proceed to Phase 10 until this phase completes successfully.

### Phase 10 — Finish development branch

Invoke: `superpowers:finishing-a-development-branch`

This step creates the pull request. It runs exactly once, here, at the end of the build process. The execution skills in Phase 4 must not call it — that is what the suppression instruction in Phase 4 enforces.

## Common Mistakes

- **Blocking on Phase 2 failure** — `move-issue-status` errors are non-fatal. Log the warning and continue. Never stop the build because of a status update failure.
- **Proceeding without a plan comment** — if `<!-- token-effort-workflow:planning-gh-issue -->` is not found in the issue, abort immediately with the message to run `/token-effort-workflow:planning-gh-issue #N` first. Do not proceed to execution without an approved plan.
- **Omitting the suppression instruction from the Phase 4 prompt** — the verbatim instruction `"Do not invoke finishing-a-development-branch — this will be handled by the calling skill after all review steps complete."` must be included in the execution skill invocation. Paraphrasing it or omitting it is incorrect.
- **Calling `finishing-a-development-branch` inside the Phase 4 execution skill** — the PR creation step belongs at Phase 10 and only there. The suppression instruction in Phase 4 enforces this; do not override it.
- **Choosing `executing-plans` for non-trivial scope plans** — the default is `subagent-driven-development`. Only switch to `executing-plans` when all conditions (single-step plan, no more than 2 files touched) are met simultaneously.
- **Silently skipping Phase 5** — Phase 5 is optional but must log a named warning when skipped. Do not silently continue without the warning.
- **Continuing past Phase 9 when `recording-decisions` is unavailable** — Phase 9 is a hard block. If the skill is not installed, stop with the error message. Do not warn and continue.
- **Passing the full raw comment body to the execution skill** — strip both the `<!-- brainstorming-gh-issue:spec -->` and `<!-- token-effort-workflow:planning-gh-issue -->` marker lines before using their content. Do not include markers in the context.
- **Not stripping the leading `#` from the issue number** — `gh issue view` requires a bare integer. Strip any `#` prefix before constructing the command.
- **Using MCP tools for issue operations** — all GitHub interactions must use `gh` CLI commands. Never call `mcp__plugin_github_github__*` tools for any operation.
- **Calling `finishing-a-development-branch` more than once** — it must be called exactly once, at Phase 10, regardless of how many execution iterations Phase 4 required.
- **Skipping Phase 3 when already on a feature branch** — Phase 3 always runs. Do not inspect the current branch name and conditionally skip worktree creation.
- **Letting `using-git-worktrees` prompt the user for a worktree location** — the path `.claude/worktrees/<branch-name>` must be supplied in the invocation prompt so the skill's interactive directory-selection flow is bypassed.
- **Treating Phase 3 failure as non-fatal** — unlike Phase 2, a failed worktree creation must stop the build immediately. Do not log a warning and continue.

## Eval

- [ ] Issue number resolved from args (with or without `#` prefix)
- [ ] Fetched issue with `gh issue view --json number,title,body,comments,labels`
- [ ] Searched comments for `<!-- brainstorming-gh-issue:spec -->` marker
- [ ] Blocked with clear error when spec comment not found
- [ ] Searched comments for `<!-- token-effort-workflow:planning-gh-issue -->` marker
- [ ] Blocked with clear error when plan comment not found
- [ ] Called `token-effort-workflow:move-issue-status <N> "Building"` in Phase 2
- [ ] Phase 2 failure logged as a warning and did not block the build
- [ ] Phase 3 invoked before the execution skill (Phase 4)
- [ ] Branch name derived as `<N>-<slug>` from issue number and title (lowercase, non-alphanumeric → hyphens, slug ≤ 50 chars)
- [ ] `superpowers:using-git-worktrees` invoked with `.claude/worktrees/<branch-name>` as the supplied path
- [ ] Phase 3 failure stops the build (not logged and continued)
- [ ] Phase 3 runs even when the current branch is not `main`
- [ ] Assessed plan complexity before choosing execution skill
- [ ] Used `subagent-driven-development` by default; `executing-plans` only when all conditions apply
- [ ] Plan content (marker stripped) passed to execution skill as context
- [ ] Suppression instruction present verbatim in the execution skill invocation prompt
- [ ] Attempted `/verify` and skipped with named warning if absent
- [ ] Performed inline simplify pass after verify; reported a summary
- [ ] Invoked `token-effort-workflow:reviewing-code-systematically`
- [ ] Addressed BLOCK or NEEDS_CHANGES findings before continuing past Phase 7
- [ ] Performed inline security review after code review; reported a summary
- [ ] Invoked `token-effort-workflow:recording-decisions` and blocked with error message if not available
- [ ] Did not proceed to Phase 9 when `recording-decisions` was unavailable
- [ ] Invoked `superpowers:finishing-a-development-branch` exactly once, at Phase 10
- [ ] `finishing-a-development-branch` was NOT called by the execution skills in Phase 4
- [ ] No MCP tools used at any point
