---
name: report-bug
description: Use when the user wants to file a new GitHub bug report through a guided interview.
user-invocable: true
---

# 🐛 Report a Bug

## Overview

Guides the user through filing a well-structured GitHub bug report. Discovers any existing bug issue templates for the current repo, conducts a conversational interview to gather description, reproduction steps, expected vs actual behaviour, logs, and environment info, shows a formatted draft for review, and files the issue via `gh issue create`.

**Usage:** `/report-bug`

## When to Use

**Use when:**
- The user wants to file a bug report and wants to ensure they capture the right context
- The user experienced unexpected behaviour and wants help shaping it into a clear GitHub issue

**Do not use when:**
- The user wants to file a feature request — use `/propose-feature` instead
- The issue already exists on GitHub — use `/brainstorming-gh-issue` to turn it into a design spec instead

## Prerequisites

The `gh` CLI must be authenticated and available in the session. All GitHub operations use `gh` commands via Bash. No MCP tools are used or required.

> **Important:** Do **not** use MCP tools (`mcp__*`) for any issue operation.

> **Shell expansion:** Never use `${VARIABLE}` or `${...}` form in bash commands. Claude Code's sandbox blocks these.

## Process

### Phase 1 — Template Discovery

Check for GitHub issue templates in the current repo:

```bash
ls .github/ISSUE_TEMPLATE/ 2>/dev/null
```

For each file returned (`.md` or `.yml` extensions), read its content. Identify any template whose **frontmatter `labels` field** contains `"bug"` or `"defect"`. Do **not** match by filename.

- **Template found:** Extract the template body/sections. Use these sections to structure the interview in Phase 2.
- **No matching template found** (directory missing, empty, or no bug/defect template): Fall back to the built-in interview questions below. Do not warn the user — proceed silently.

### Phase 2 — Interview

Conduct a **conversational** interview — one question at a time. Let each answer inform what to ask next. Stop when enough is gathered for a complete, actionable report (typically three to five substantive exchanges).

**If a template was found:** use its sections to frame the questions in order.

**Built-in fallback question set** (used when no matching template found):

1. **Describe the bug** — what's happening?
2. **Steps to reproduce** — numbered steps to reliably trigger it
3. **Expected behaviour** — what should have happened?
4. **Actual behaviour** — what happened instead? (skip if already clear from Q1)
5. **Error logs / stack traces** — any relevant output? (ask only if likely applicable)
6. **Environment** — OS, shell, tool versions, etc.; ask the user to describe; note it's optional if not relevant to this bug. Do **not** auto-gather this information by running commands.
7. **Screenshots** — any visuals to share? Remind the user they'll need to attach them manually via the GitHub web UI after the issue is filed
8. **Title** — ask for or confirm a concise issue title (5–10 words) before moving to Phase 3

### Phase 3 — Draft and Review

Format the collected answers into an issue body. Structure depends on whether a template was used:

- **If template matched:** Fill in the template's sections with the user's answers. Preserve the template's section headings.
- **If fallback:** Use this standard structure:

```
**Describe the bug**
<description>

**Steps to Reproduce**
1. ...

**Expected Behaviour**
<expected>

**Actual Behaviour**
<actual>

**Error Logs**
<logs>

**Environment**
<environment details>

**Screenshots**
<!-- Add screenshots here via the GitHub web UI -->
```

Omit any section for which no information was collected, **except** the screenshots placeholder — always include it.

Show the user the full draft:

```
**Title:** <title>

---
<formatted body>
```

Ask: "Does this look right? Any changes before I file it?"

Allow the user to request edits. After each round of edits, re-display the **full updated draft** (title + body) and ask for approval again. Repeat until the user gives explicit approval (e.g., "looks good", "file it", "yes").

### Phase 4 — File the Issue

Once the user explicitly approves, run:

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
- **Applying labels, assignees, or milestones** — file with no extra metadata.
- **Matching templates by filename** — match only by frontmatter `labels` field containing `"bug"` or `"defect"`.
- **Auto-gathering environment info** — always ask the user; do not run `uname`, version commands, etc.
- **Omitting the screenshots placeholder** — always include `<!-- Add screenshots here via the GitHub web UI -->` in the draft, even if the user has no screenshots.
- **Silently failing template discovery** — if `.github/ISSUE_TEMPLATE/` doesn't exist, fall back without warning.

## Eval

- [ ] Ran `ls .github/ISSUE_TEMPLATE/ 2>/dev/null` to check for templates
- [ ] Read template files and checked frontmatter `labels` for "bug" or "defect" (not filename)
- [ ] When a matching template was found: used its sections to frame the interview
- [ ] When no matching template: fell back to built-in questions silently (no warning to user)
- [ ] Interview was conversational — one question at a time
- [ ] Did NOT auto-gather environment info; asked the user instead
- [ ] Reminded user about screenshots and noted they must be attached via the GitHub web UI
- [ ] Asked the user to confirm or provide a concise title before drafting
- [ ] Showed a formatted draft preview (title + body) before filing
- [ ] Screenshots placeholder (`<!-- Add screenshots here via the GitHub web UI -->`) always present in draft
- [ ] Allowed the user to request edits and re-displayed the full draft until explicit approval
- [ ] Did NOT call `gh issue create` until user explicitly approved
- [ ] Called `gh issue create --title "..." --body "..."` with no extra flags
- [ ] Reported the filed issue URL to the user
- [ ] No `mcp__` tool was called at any point
