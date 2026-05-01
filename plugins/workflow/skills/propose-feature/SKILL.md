---
name: propose-feature
description: Use when the user wants to file a new GitHub feature request through a guided interview.
user-invocable: true
---

# 📝 Propose a Feature

## Overview

Guides the user through filing a well-structured GitHub feature request. Discovers any existing issue templates for the current repo, conducts a conversational interview to gather problem motivation, use cases, and proposed solution, shows a formatted draft for review, and files the issue via `gh issue create`.

**Usage:** `/propose-feature`

## When to Use

**Use when:**
- The user wants to file a new feature request and wants to ensure they capture the right context
- The user has a rough idea and wants help shaping it into a clear GitHub issue

**Do not use when:**
- The issue already exists on GitHub — use `/brainstorming-gh-issue` to turn it into a design spec instead
- The user wants to file a bug report — this skill is for feature/enhancement requests only

## Prerequisites

The `gh` CLI must be authenticated and available in the session. All GitHub operations use `gh` commands via Bash. No MCP tools are used or required.

> **Important:** Do **not** use MCP tools (`mcp__plugin_github_github__*`) for any issue operation.

> **Shell expansion:** Never use `${VARIABLE}` or `${...}` form in bash commands. Claude Code's sandbox blocks these.

## Process

### Phase 1 — Template Discovery

Check for GitHub issue templates in the current repo:

```bash
ls .github/ISSUE_TEMPLATE/ 2>/dev/null
```

For each file returned (`.md` or `.yml` extensions), read its content. Identify any template whose **filename** contains "feature" or "enhancement", or whose **frontmatter `labels` field** contains "feature" or "enhancement".

- **Template found:** Extract the template body/sections. Use these sections to structure the interview in Phase 2 (e.g., if the template has a "Is your feature request related to a problem?" section, use that as the opening prompt).
- **No matching template found** (directory missing, empty, or no feature/enhancement template): Fall back to the built-in interview questions below. Do not warn the user — proceed silently.

### Phase 2 — Interview

Conduct a **conversational** interview. Do not dump all questions at once. Let each answer inform what to ask next.

**Built-in question set** (used when no template found, or as a baseline when a template is found):

1. **Opening (always first):** "What problem are you trying to solve?" — Understand the motivation before the solution.
2. **Use cases:** Who experiences this problem? In what scenarios? (Ask only if not clear from the opening answer.)
3. **Proposed solution:** What solution are you proposing? (Ask only after understanding the problem.)
4. **Alternatives:** Have you considered any alternatives? (Skip if the user already addressed this.)
5. **Constraints:** Any scope limits, constraints, or out-of-scope items worth noting? (Ask if the feature seems broad.)
6. **Title:** Ask the user for a concise issue title (5–10 words) before moving to Phase 3. If a clear title emerged naturally from the interview, propose it and ask the user to confirm or adjust.

Keep the interview brief — stop asking when you have enough for a complete, actionable issue. Three to five substantive exchanges is usually sufficient.

### Phase 3 — Draft and Review

Format the collected answers into an issue body. Structure depends on whether a template was used:

- **If template matched:** Fill in the template's sections with the user's answers. Preserve the template's section headings.
- **If fallback:** Use this standard structure:

```
**Problem**
<what problem this solves>

**Proposed Solution**
<what the user wants to build or change>

**Use Cases**
<who benefits and in what scenarios>

**Alternatives Considered**
<other approaches and why they were ruled out>
```

Omit any section for which no information was collected.

Show the user the full draft:

```
**Title:** <title>

---
<formatted body>
```

Ask: "Does this look right? Any changes before I file it?"

Allow the user to request edits. After each round of edits, re-display the **full updated draft** (title + body) and ask for approval again. Repeat until the user gives explicit approval (e.g., "looks good", "file it", "yes").

### Phase 4 — File the Issue

Once the user approves, run:

```bash
gh issue create --title "<title>" --body "<body>"
```

Use no additional flags — no `--label`, `--assignee`, or `--milestone`.

`gh issue create` prints the URL of the new issue. Report it to the user:

> "Done. Issue filed: \<url\>"

## Common Mistakes

- **Using MCP tools** — all issue interactions must use `gh` CLI commands only.
- **Filing before user approval** — `gh issue create` must NOT be called until the user explicitly approves the draft in Phase 3.
- **Dumping all interview questions at once** — the interview must be conversational; let answers drive follow-up questions.
- **Forgetting to ask for a title** — always confirm a concise title before Phase 3.
- **Using `${VARIABLE}` shell expansion** — not supported in Claude Code's sandbox; avoid.
- **Applying labels, assignees, or milestones** — file with no extra metadata per skill design.
- **Silently failing template discovery** — if `.github/ISSUE_TEMPLATE/` doesn't exist, fall back to built-in questions without warning.
- **Asking about feature vs. bug** — this skill is feature/enhancement only; do not prompt the user to choose a type.

## Eval

- [ ] Ran `ls .github/ISSUE_TEMPLATE/ 2>/dev/null` to check for templates
- [ ] Read and checked template filenames/frontmatter for "feature" or "enhancement"
- [ ] When a matching template was found: used its sections to frame the interview
- [ ] When no matching template: fell back to built-in questions silently (no warning to user)
- [ ] Interview opened with a problem-focused question, not a solution question
- [ ] Follow-up questions were conversational, not asked all at once
- [ ] Asked the user to confirm or provide a concise title before drafting
- [ ] Showed a formatted draft preview (title + body) before filing
- [ ] Allowed the user to request edits and iterated until explicit approval
- [ ] Did NOT call `gh issue create` until user explicitly approved
- [ ] Called `gh issue create --title "..." --body "..."` with no extra flags
- [ ] Reported the filed issue URL to the user
- [ ] No `mcp__` tool was called at any point
