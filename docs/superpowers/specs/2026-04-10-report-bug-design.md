# 🐛 `/report-bug` Skill Design

**Date:** 2026-04-10
**Issue:** #36
**Status:** Approved

---

## 📋 Overview

`report-bug` is a user-invocable skill (`/report-bug`, no arguments) that guides the user through filing a complete, actionable GitHub bug report. It is the bug-report counterpart to `propose-feature` — same four-phase shape adapted for bug reports.

- All GitHub operations use the `gh` CLI; no MCP tools are used
- No labels, assignees, or milestones are applied when filing
- Shell expansion (`${...}`) is never used in bash commands

---

## 🔍 Phase 1 — Template Discovery

Run:

```bash
ls .github/ISSUE_TEMPLATE/ 2>/dev/null
```

For each `.md` or `.yml` file returned, read its content and check the frontmatter `labels` field for `"bug"` or `"defect"`. If a match is found, extract the template body/sections to drive the interview in Phase 2.

If no match is found (directory missing, empty, or no bug/defect template), fall back to the built-in question set silently — no warning to the user.

---

## 💬 Phase 2 — Interview

Conduct a **conversational** interview — one question at a time, letting each answer inform the next. Stop when enough is gathered for a complete report (typically three to five substantive exchanges).

**If a template was found:** use its sections to frame the questions in order.

**Built-in fallback question set** (used when no template found):

1. **Describe the bug** — what's happening?
2. **Steps to reproduce** — numbered steps to reliably trigger it
3. **Expected behaviour** — what should have happened?
4. **Actual behaviour** — what happened instead? (skip if already clear from Q1)
5. **Error logs / stack traces** — any relevant output? (ask only if likely applicable)
6. **Environment** — OS, shell, tool versions, etc.; ask the user to describe; note it's optional if not relevant to this bug
7. **Screenshots** — any visuals to share? Remind the user they'll need to attach them manually via the GitHub web UI after the issue is filed
8. **Title** — ask for or confirm a concise issue title (5–10 words) before moving to Phase 3

---

## 📝 Phase 3 — Draft & Review

Format collected answers into an issue body:

**If a template matched:** fill in the template's sections with the user's answers, preserving section headings.

**If fallback:** use this standard structure:

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

Allow the user to request edits. After each round, re-display the **full updated draft** (title + body) and ask for approval again. Repeat until the user gives explicit approval.

---

## 🚀 Phase 4 — File the Issue

Once the user explicitly approves:

```bash
gh issue create --title "<title>" --body "<body>"
```

No additional flags — no `--label`, `--assignee`, or `--milestone`.

Report the filed issue URL to the user:

> "Done. Issue filed: \<url\>"

---

## ⚠️ Common Mistakes

- **Using MCP tools** — all issue interactions must use `gh` CLI commands only
- **Filing before user approval** — `gh issue create` must NOT be called until the user explicitly approves the draft in Phase 3
- **Dumping all questions at once** — the interview must be conversational; let answers drive follow-up questions
- **Forgetting to ask for a title** — always confirm a concise title before Phase 3
- **Using `${VARIABLE}` shell expansion** — not supported in Claude Code's sandbox
- **Applying labels, assignees, or milestones** — file with no extra metadata
- **Matching templates by filename** — match only by frontmatter `labels` field containing "bug" or "defect"
- **Auto-gathering environment info** — always ask the user; do not run `uname`, version commands, etc.
- **Omitting the screenshots placeholder** — always include `<!-- Add screenshots here via the GitHub web UI -->` in the draft, even if the user has no screenshots
- **Silently failing template discovery** — if `.github/ISSUE_TEMPLATE/` doesn't exist, fall back without warning

---

## ✅ Eval Checklist

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
