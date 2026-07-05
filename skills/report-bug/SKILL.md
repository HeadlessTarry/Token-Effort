---
name: report-bug
description: Use when the user wants to file a new GitHub bug report through a guided interview.
user-invocable: true
---

# 🐛 Report a Bug

## Overview

Guides the user through filing a well-structured GitHub bug report. Discovers any existing bug issue templates for the current repo using a three-tier discovery strategy, conducts a conversational interview to gather description, reproduction steps, expected vs actual behaviour, logs, and environment info, shows a formatted draft for review, and files the issue via `gh issue create`.

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

> **Important:** Do **not** use MCP tools (`mcp__*`) for any issue operation, even if they appear to be available.

> **Shell expansion:** Never use `${VARIABLE}` or any `${...}` form in bash commands. Use `printenv VARIABLE` to read environment variables.

> **Posting GitHub content:** Always write the comment/issue body, post it with `--body-file`, and clean up the temp file in a **single bash command** using a heredoc with `&&` chaining. Never use the Write tool or separate operations for temp files — this triggers `external_directory` permission checks that hang in non-interactive CI. Never pass body content directly via `--body "..."` as this is vulnerable to shell escaping issues.

## Process

### Phase 1 — Template Discovery (multi-tier)

Check for GitHub issue templates in the current repo:

```bash
ls .github/ISSUE_TEMPLATE/ 2>/dev/null
```

For each file returned (`.md` or `.yml` extensions), read its content. Apply the following three-tier discovery strategy in order — **first match wins**:

**Tier 1 — Frontmatter `labels` field:** Check if the template's frontmatter `labels` field contains `"bug"` or `"defect"` (case-insensitive).

**Tier 2 — Frontmatter `name` field:** If Tier 1 did not match, check if the template's frontmatter `name` field contains `"bug"` or `"defect"` (case-insensitive).

**Tier 3 — Structural analysis:** If Tiers 1 and 2 did not match, check if the template body contains bug-pattern headings. Match if any of the following appear in the template body (case-insensitive): `"Describe the bug"`, `"To Reproduce"`, `"Steps to reproduce"`, `"Expected behavior"`, `"reproduction steps"`.

- **Template found (any tier):** Extract the template body/sections. Use these sections to structure the interview in Phase 2. Record which tier matched (for eval verification).
- **No matching template found** (directory missing, empty, or no bug/defect template in any tier): Fall back to the built-in interview questions below. Do not warn the user — proceed silently.

### Phase 2 — Interview

Conduct a **conversational** interview — one question at a time. Let each answer inform what to ask next. Stop when enough is gathered for a complete, actionable report (typically three to five substantive exchanges).

**If a template was found:** use its sections to frame the questions in order.

**Built-in fallback question set** (used when no matching template found in any tier):

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

Once the user explicitly approves:

Write the issue body, create the issue, and clean up the temp file in a single bash command using a heredoc:

- **Linux/macOS:**
  ```bash
  cat > "$(printenv TMPDIR)/gh-comment-body.md" << 'EOF'
  <approved issue body>
  EOF
  gh issue create --title "<title>" --body-file "$(printenv TMPDIR)/gh-comment-body.md" && rm "$(printenv TMPDIR)/gh-comment-body.md"
  ```
  Fall back to `/tmp/gh-comment-body.md` if `TMPDIR` is unset.

- **Windows:**
  ```bash
  cat > "$(printenv TEMP)/gh-comment-body.md" << 'EOF'
  <approved issue body>
  EOF
  gh issue create --title "<title>" --body-file "$(printenv TEMP)/gh-comment-body.md" && rm "$(printenv TEMP)/gh-comment-body.md"
  ```

Use no additional flags — no `--label`, `--assignee`, or `--milestone`.

`gh issue create` prints the URL of the new issue. Report it to the user:

> "Done. Issue filed: \<url\>"

## Common Mistakes

- **Using `--body` instead of `--body-file`** — always write the issue body to a temp file first, then use `gh issue create --title "<title>" --body-file <temp-path>`. Never pass body content directly via `--body "..."` as this is vulnerable to shell escaping issues.
- **Using separate operations for temp file write/post/cleanup** — always consolidate the write, post, and cleanup into a single bash command using a heredoc with `&&` chaining. Never use the Write tool or separate bash commands for these operations, as this triggers `external_directory` permission checks that hang in non-interactive CI environments.
- **Using MCP tools** — all issue interactions must use `gh` CLI commands only. Never call any `mcp__*` tool.
- **Filing before user approval** — `gh issue create` must NOT be called until the user explicitly approves the draft in Phase 3.
- **Dumping all interview questions at once** — the interview must be conversational; let answers drive follow-up questions.
- **Forgetting to ask for a title** — always confirm a concise title before Phase 3.
- **Applying labels, assignees, or milestones** — file with no extra metadata.
- **Auto-gathering environment info** — always ask the user; do not run `uname`, version commands, etc.
- **Omitting the screenshots placeholder** — always include `<!-- Add screenshots here via the GitHub web UI -->` in the draft, even if the user has no screenshots.
- **Silently failing template discovery** — if `.github/ISSUE_TEMPLATE/` doesn't exist, fall back without warning.
- **Using shell expansion syntax** — never use `${VARIABLE}` or any `${...}` form. Use `printenv VARIABLE` instead.

## Eval

- [ ] Ran `ls .github/ISSUE_TEMPLATE/ 2>/dev/null` to check for templates
- [ ] Read template files and applied three-tier discovery: Tier 1 (frontmatter `labels`), Tier 2 (frontmatter `name`), Tier 3 (structural headings)
- [ ] When Tier 1 did not match: checked frontmatter `name` field for "bug" or "defect" (case-insensitive) before falling through to Tier 3
- [ ] When Tiers 1 and 2 did not match: checked template body for bug-pattern headings ("Describe the bug", "To Reproduce", "Steps to reproduce", "Expected behavior", "reproduction steps")
- [ ] When no matching template found in any tier: fell back to built-in questions silently (no warning to user)
- [ ] When a matching template was found: used its sections to frame the interview
- [ ] Interview was conversational — one question at a time
- [ ] Did NOT auto-gather environment info; asked the user instead
- [ ] Reminded user about screenshots and noted they must be attached via the GitHub web UI
- [ ] Asked the user to confirm or provide a concise title before drafting
- [ ] Showed a formatted draft preview (title + body) before filing
- [ ] Screenshots placeholder (`<!-- Add screenshots here via the GitHub web UI -->`) always present in draft
- [ ] Allowed the user to request edits and re-displayed the full draft until explicit approval
- [ ] Did NOT call `gh issue create` until user explicitly approved
- [ ] Called `gh issue create --title "..." --body-file <temp-path>` with no extra flags
- [ ] Reported the filed issue URL to the user
- [ ] No `mcp__` tool was called at any point
