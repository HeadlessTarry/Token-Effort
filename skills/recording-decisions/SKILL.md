---
name: recording-decisions
description: Use when committing an Architecture Decision Record (ADR) to docs/decisions/ — generates a complete draft from available context, then presents for single-turn review with supersession support. Called from /building-gh-issue Phase 8 with spec context pre-populated; can also be run standalone.
user-invocable: true
---

# 📝 Recording Decisions

## Overview

Generates a complete draft Architecture Decision Record (ADR) from available context, then presents it for single-turn review with supersession support. When called from `/building-gh-issue`, auto-populates fields from the spec. When standalone, derives what it can and uses `[TODO: ...]` placeholders for the rest.

**Usage:** `/recording-decisions`

## When to Use

**Use when:**
- Phase 8 of `/building-gh-issue` calls this skill after code review
- You want to capture an architectural decision as an in-repo record

**Do not use when:**
- The change is a pure bug fix or cosmetic update with no architectural implications

## Prerequisites

The `gh` CLI must be authenticated and available in the session. All GitHub operations use `gh` commands via Bash. No MCP tools are used or required.

> **Important:** Do **not** use MCP tools (`mcp__*`) for any issue operation, even if they appear to be available.

> **Shell expansion:** Never use `${VARIABLE}` or any `${...}` form in bash commands. Use `printenv VARIABLE` to read environment variables.

## ADR File Format

**Location:** `docs/decisions/YYYY-MM-<slug>.md`
**Naming:** YYYY = current year, MM = zero-padded current month (e.g. `04` for April), `<slug>` = kebab-case summary.

```markdown
# YYYY-MM-<slug>

> **Status:** Active
> **Issue:** [#N — Title](https://github.com/owner/repo/issues/N)
> **Date:** YYYY-MM-DD

## Context

<what problem prompted this decision>

## Decision

<what was decided and why>

## Consequences

<trade-offs, known limitations, anything that should inform future work>
```

If the ADR supersedes existing ADRs, the Status line reads:

```
> **Status:** Supersedes [2025-11-use-sqlite-for-storage](2025-11-use-sqlite-for-storage.md), [...]
```

## Process

### Phase 1 — Resolve owner/repo and current date

```bash
git remote get-url origin
```

Parse owner and repo from the URL (strip `.git`, split on `/` for HTTPS or `:` for SSH). Also record the current date:

```bash
date +%Y-%m-%d
```

Extract `YYYY` (year) and `MM` (zero-padded month) for the filename prefix.

### Phase 2 — Auto-fill ADR fields from available context

**Issue number and title:**
- Context mode: read issue number and title from the `/building-gh-issue` spec context
- Standalone: if issue number is known from user input, fetch title via `gh issue view <N> --json number,title`; otherwise ask user for issue number. If user has no issue number, skip issue link in ADR metadata and prompt for slug directly.

**Slug:**
- Derive from spec headline, issue title, or user-provided text
- Auto-fill; no separate confirmation step

**Context, Decision, Consequences:**
- Context mode: auto-populate from corresponding spec sections
- Standalone: attempt to derive from issue body/comments; if insufficient → `[TODO: ...]` placeholder

Unfillable fields get a `[TODO: brief guidance]` placeholder. No intermediate prompts for individual fields.

### Phase 3 — Supersession auto-detection

```bash
ls docs/decisions/ 2>/dev/null
```

If ADRs exist, scan slugs for keyword overlap with current issue title / spec content. Split each slug on hyphens into tokens, then count token matches against the issue title and spec content. Rank candidates by match count. Include all existing ADRs in the draft, with suggested supersessions highlighted first:

```
## Supersession (suggested)
- 2025-11-use-sqlite-for-storage ← keyword overlap: "sqlite", "storage"
- 2025-08-auth-middleware-approach ← keyword overlap: "auth"
```

User can confirm, remove, or add supersessions in the review prompt.

### Phase 4 — Single batched review prompt

Present the complete draft ADR in a single message:

```markdown
# YYYY-MM-<slug>

> **Status:** Active
> **Issue:** [#N — Title](https://github.com/owner/repo/issues/N)
> **Date:** YYYY-MM-DD

## Context

[auto-filled or TODO: describe the problem that prompted this decision]

## Decision

[auto-filled or TODO: describe what was decided and why]

## Consequences

[auto-filled or TODO: describe trade-offs, known limitations]

## Supersession (suggested)

- 2025-11-use-sqlite-for-storage
```

Then ask:

> "Review the draft ADR above. Fill in any TODO sections, confirm or edit the supersession candidates, and describe any changes needed. Reply 'yes' when satisfied."

If user provides changes → apply all, re-assemble, re-present. Repeat until "yes".

**No file write or commit until user replies "yes".**

### Phase 5 — Write + commit

```bash
mkdir -p docs/decisions
```

Write ADR to `docs/decisions/YYYY-MM-<slug>.md`.

If supersession occurred:
- Set Status to `Supersedes [slug](slug.md), ...`
- Prepend `> ⚠️ Superseded by [YYYY-MM-new-slug](YYYY-MM-new-slug.md)` after heading in each superseded file
- Include all modified files in same commit

```bash
git add docs/decisions/
git commit -m "docs: record decision YYYY-MM-<slug> (issue #N)"
```

Report committed file path.

## Common Mistakes

- **Using subagent dispatch** — this skill runs directly in the calling session. Do NOT spawn a subagent or use any dispatcher pattern.
- **Prompting for individual fields** — auto-fill all fields from available context. Use `[TODO: ...]` placeholders for unfillable fields. Do NOT prompt for each field separately.
- **Writing the file before user approval** — the draft ADR must be presented for review first. No file write or commit happens until the user replies "yes".
- **Treating ambiguous affirmatives as approval** — only "yes" (case-insensitive) exits the review loop. Responses like "looks good", "ok", or "fine" are change requests — apply them and re-present the draft.
- **Silently skipping unrecognised supersession filenames** — if the user types a filename not found in `docs/decisions/`, warn and re-prompt. Never silently skip.
- **Using sequential numbering in filenames** — format is `YYYY-MM-<slug>`, not `YYYY-NNN-<slug>`. Use year-month prefix only.
- **Forgetting `mkdir -p docs/decisions`** — always create the directory before writing, even if it probably exists.
- **Partial commit on supersession** — all modified superseded files must be in the same commit as the new ADR. Never commit only the new file.
- **Wrong location for supersession note** — the `> ⚠️ Superseded by ...` line goes immediately after the `# YYYY-MM-<slug>` heading, before the blockquote metadata.
- **Using shell expansion syntax** — never use `${VARIABLE}`, `${VARIABLE:-}`, or any `${...}` form. Use `printenv VARIABLE` to read environment variables.
- **Using MCP tools for issue operations** — all issue interactions must use `gh` CLI commands. Never call any `mcp__*` tool, even if they appear to be available.

## Eval

- [ ] Resolved owner/repo from `git remote get-url origin`
- [ ] Used current year and zero-padded month for filename prefix
- [ ] Auto-filled ADR fields from available context (spec sections or issue data)
- [ ] Used `[TODO: ...]` placeholders for fields that could not be auto-filled
- [ ] Did NOT prompt for individual fields separately (no per-field confirmation)
- [ ] Presented complete draft ADR in a single review prompt
- [ ] Did NOT write the ADR file or call `git commit` before receiving explicit "yes"
- [ ] Looped back to show a revised draft when the user requested changes at the review gate
- [ ] Scanned `docs/decisions/` for existing ADRs and performed keyword overlap scoring
- [ ] Ranked and highlighted suggested supersession candidates in the draft
- [ ] Verified existence of any user-supplied supersession filenames before accepting them
- [ ] Warned and re-prompted when a user-supplied filename was not found
- [ ] When supersession occurred: set Status to `Supersedes [slug](slug.md)` format
- [ ] When supersession occurred: prepended supersession note immediately after heading
- [ ] When supersession occurred: included all modified files in same commit
- [ ] Created `docs/decisions/` directory if it did not exist (`mkdir -p`)
- [ ] Committed with message `docs: record decision YYYY-MM-<slug> (issue #N)`
- [ ] Reported committed file path to user
- [ ] No subagent was dispatched at any point
- [ ] No `mcp__` tool was called at any point
