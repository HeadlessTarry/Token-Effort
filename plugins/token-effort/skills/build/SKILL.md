---
name: build
description: Use when implementing a GitHub issue end-to-end — from design spec to merged PR.
user-invocable: true
---

# Build

## Overview

Implements a GitHub issue end-to-end: fetches the issue and its approved design spec, moves the issue to "Building" status, writes and approves an implementation plan, executes the plan, verifies and reviews the result, and opens a pull request. The process is gated at the planning stage — execution does not begin until a plan has been approved. The pull request is created exactly once, at the final phase.

**Usage:** `/token-effort:build <issue-number>`

Strip any leading `#` from the issue number before use (e.g. `#42` → `42`).

## When to Use

**Use when:**
- A GitHub issue has an approved design spec comment (produced by `token-effort:brainstorming-gh-issue`) and is ready to be implemented
- You want a structured, end-to-end build workflow from spec to merged PR

**Do not use when:**
- The issue does not yet have a design spec comment — run `/token-effort:brainstorming-gh-issue <N>` first and get the spec approved
- Implementation is already underway on a branch — join that branch directly instead

## Prerequisites

- `gh` CLI must be authenticated and available in the session. All GitHub operations use `gh` commands via `Bash`. No MCP tools are used or required.
- The issue must have a design spec comment whose body begins with `<!-- brainstorming-gh-issue:spec -->`, produced by `token-effort:brainstorming-gh-issue`.
- The following `superpowers` skills must be installed:
  - `superpowers:writing-plans`
  - `superpowers:executing-plans`
  - `superpowers:subagent-driven-development`
  - `superpowers:finishing-a-development-branch`

> **Important:** Do **not** use MCP tools (`mcp__plugin_github_github__*`) for any issue or GitHub operation.

## Process

### Phase 1 — Fetch issue and extract spec

Run:

```bash
gh issue view <N> --json number,title,body,comments,labels
```

Search the `comments` array for a comment whose body starts with `<!-- brainstorming-gh-issue:spec -->`.

**If no such comment is found:** Stop immediately with the error:

> "Issue #N does not have a design spec comment. Run `/token-effort:brainstorming-gh-issue <N>` to generate one, then get it approved before building."

**If found:** Extract the spec body — the full comment content **after** stripping the `<!-- brainstorming-gh-issue:spec -->` marker line. This stripped body is the spec context used in Phase 3.

### Phase 2 — Move issue to Building status

Invoke: `token-effort:move-issue-status <N> "Building"`

If this fails for any reason (e.g. the issue is not on a project board, or the skill is unavailable), **log a warning and continue**. This phase is non-fatal — do not block the build on a status update failure.

### Phase 3 — Write implementation plan

Invoke: `superpowers:writing-plans`

Pass the spec body extracted in Phase 1 as the context. `writing-plans` runs its own user-approval loop — wait for it to complete and for a plan to be approved before proceeding to Phase 4.

### Phase 4 — Execute plan

Assess the plan produced by Phase 3. Choose the execution skill:

| Skill | When to use |
|-------|-------------|
| `superpowers:executing-plans` | **Default.** Use for most plans. |
| `superpowers:subagent-driven-development` | Use **only** when ALL THREE of the following apply: (1) the plan has many independent tasks with no sequential dependencies between them, (2) changes span 5 or more separate subsystems/modules, and (3) the plan is explicitly scoped as large or complex. |

Invoke the chosen skill with the following **mandatory suppression instruction** included verbatim in the prompt:

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

Invoke: `token-effort:reviewing-code-systematically`

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

### Phase 9 — Record decisions (optional)

Attempt to invoke: `token-effort:recording-decisions`

If the skill is not available, log the following named warning and continue:

> "⚠️ Phase 9 skipped: `token-effort:recording-decisions` skill not available (planned; see issue #49)"

Do not block on this phase.

### Phase 10 — Finish development branch

Invoke: `superpowers:finishing-a-development-branch`

This step creates the pull request. It runs exactly once, here, at the end of the build process. The execution skills in Phase 4 must not call it — that is what the suppression instruction in Phase 4 enforces.

## Common Mistakes

- **Blocking on Phase 2 failure** — `move-issue-status` errors are non-fatal. Log the warning and continue. Never stop the build because of a status update failure.
- **Omitting the suppression instruction from the Phase 4 prompt** — the verbatim instruction `"Do not invoke finishing-a-development-branch — this will be handled by the calling skill after all review steps complete."` must be included in the execution skill invocation. Paraphrasing it or omitting it is incorrect.
- **Calling `finishing-a-development-branch` inside the Phase 4 execution skill** — the PR creation step belongs at Phase 10 and only there. The suppression instruction in Phase 4 enforces this; do not override it.
- **Choosing `subagent-driven-development` for moderate-scope plans** — the default is `executing-plans`. Only switch to `subagent-driven-development` when all three conditions (independent tasks, 5+ subsystems, explicitly large/complex scope) are met simultaneously.
- **Silently skipping Phase 5 or Phase 9** — these are optional phases but must log a named warning when skipped. Do not silently continue without the warning.
- **Passing the full raw comment body to `writing-plans`** — strip the `<!-- brainstorming-gh-issue:spec -->` marker line before passing the spec body. Do not include the marker in the context.
- **Not stripping the leading `#` from the issue number** — `gh issue view` requires a bare integer. Strip any `#` prefix before constructing the command.
- **Using MCP tools for issue operations** — all GitHub interactions must use `gh` CLI commands. Never call `mcp__plugin_github_github__*` tools for any operation.
- **Proceeding past Phase 3 before a plan is approved** — `writing-plans` includes a user-approval loop. Wait for approval before executing. Do not skip into Phase 4 on the first plan draft.
- **Calling `finishing-a-development-branch` more than once** — it must be called exactly once, at Phase 10, regardless of how many execution iterations Phase 4 required.

## Eval

- [ ] Issue number resolved from args (with or without `#` prefix)
- [ ] Fetched issue with `gh issue view --json number,title,body,comments,labels`
- [ ] Searched comments for `<!-- brainstorming-gh-issue:spec -->` marker
- [ ] Blocked with clear error when spec comment not found
- [ ] Called `token-effort:move-issue-status <N> "Building"` before `writing-plans`
- [ ] Phase 2 failure logged as a warning and did not block the build
- [ ] Invoked `superpowers:writing-plans` with spec body as context (marker line stripped)
- [ ] Waited for plan approval before proceeding to Phase 4
- [ ] Assessed plan complexity before choosing execution skill
- [ ] Used `executing-plans` by default; `subagent-driven-development` only when all three conditions apply
- [ ] Suppression instruction present verbatim in the execution skill invocation prompt
- [ ] Attempted `/verify` and skipped with named warning if absent
- [ ] Performed inline simplify pass after verify; reported a summary
- [ ] Invoked `token-effort:reviewing-code-systematically`
- [ ] Addressed BLOCK or NEEDS_CHANGES findings before continuing past Phase 7
- [ ] Performed inline security review after code review; reported a summary
- [ ] Attempted `token-effort:recording-decisions` and skipped with named warning if absent
- [ ] Invoked `superpowers:finishing-a-development-branch` exactly once, at Phase 10
- [ ] `finishing-a-development-branch` was NOT called by the execution skills in Phase 4
- [ ] No MCP tools used at any point
