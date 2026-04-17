---
name: recording-decisions
description: Use when committing an Architecture Decision Record (ADR) to docs/decisions/ — guides through Context, Decision, and Consequences fields with supersession support. Called from /token-effort:building-gh-issue Phase 8 with spec context pre-populated; can also be run standalone.
user-invocable: true
---

# Recording Decisions

## Overview

Guides the user through creating an Architecture Decision Record (ADR) and commits
it to `docs/decisions/`. When called from `/token-effort:building-gh-issue`, auto-populates fields from the
spec in context. When called standalone, prompts all fields interactively.

**Usage:** `/token-effort:recording-decisions`

## When to Use

**Use when:**
- Phase 8 of `/token-effort:building-gh-issue` calls this skill after code review
- You want to capture an architectural decision as an in-repo record

**Do not use when:**
- The change is a pure bug fix or cosmetic update with no architectural implications

## ADR File Format

**Location:** `docs/decisions/YYYY-MM-<slug>.md`
**Naming:** YYYY = current year, MM = zero-padded current month (e.g. `04` for
April), `<slug>` = kebab-case summary confirmed by user.

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

Parse owner and repo from the URL (strip `.git`, split on `/` for HTTPS or `:` for SSH).
Also record the current date:

```bash
date +%Y-%m-%d
```

Extract `YYYY` (year) and `MM` (zero-padded month) for the filename prefix.

### Phase 2 — Collect and confirm fields

Present each field in order. When running inside `/token-effort:building-gh-issue`, auto-populate from the
spec context. When standalone, prompt for all fields.

**1. Issue number and title**
- `/token-effort:building-gh-issue` context: read issue number and title from context
- Standalone: "What is the GitHub issue number for this decision? (e.g. 42)"
- Construct the full URL: `https://github.com/<owner>/<repo>/issues/<N>`

**2. Slug**
- `/token-effort:building-gh-issue` context: derive slug from the spec headline
- Standalone with issue number: fetch title via `gh issue view <N> --json title -q .title`, then derive slug from that title
- Standalone without issue: ask the user for a short description to derive the slug from
- Show: `Suggested slug: \`<slug>\` — press Enter to accept or type a new one:`
- Confirmed slug is used as the filename suffix

**3. Context**
- `/token-effort:building-gh-issue`: auto-populate from the spec's Context / problem statement section
- Show the text and ask: `Context (from spec) — press Enter to accept or paste a replacement:`
- Standalone: "Describe what problem prompted this decision:"

**4. Decision**
- `/token-effort:building-gh-issue`: auto-populate from the spec's recommended approach section
- Same confirmation pattern as Context
- Standalone: "Describe what was decided and why:"

**5. Consequences**
- `/token-effort:building-gh-issue`: auto-populate from the spec's trade-offs / limitations section
- Same confirmation pattern as Context
- Standalone: "Describe the trade-offs, known limitations, or anything that should inform future work:"

### Phase 3 — Supersession check

After all fields are confirmed:

1. List existing ADRs:

```bash
ls docs/decisions/ 2>/dev/null
```

2. If ADR files exist, list ALL existing ADRs and present them for the user to
   review. Use keyword overlap between existing slugs and the current issue title /
   spec content to rank or highlight potentially related ones — but never filter
   them out. Present the full list:

```
I found these existing ADRs — do any get superseded by this decision?

- 2025-11-use-sqlite-for-storage
- 2025-08-auth-middleware-approach

Enter the numbers of any to supersede, add others by filename, or press Enter to skip.
```

3. The user may select from the list, type additional filenames, or press Enter to skip.

4. For any filename the user types that was NOT in the presented list, verify it exists:

```bash
ls docs/decisions/<filename>
```

If not found, warn and re-prompt — do not silently skip:
> "File `<filename>` not found in `docs/decisions/`. Please check the name and try again:"

5. **If ADRs are superseded:**
   - Set new ADR Status: `Supersedes [slug](slug.md), ...`
   - Prepend this line to each superseded file immediately after its `# heading` line:
     ```
     > ⚠️ Superseded by [YYYY-MM-new-slug](YYYY-MM-new-slug.md)
     ```
   - Include all modified superseded files in the same commit as the new ADR

6. **If none superseded:** Status = `Active`, no existing files modified.

### Phase 4 — Create `docs/decisions/` if needed

```bash
mkdir -p docs/decisions
```

### Phase 5 — Write the ADR file

Assemble the ADR from confirmed fields and write to `docs/decisions/YYYY-MM-<slug>.md`.

### Phase 6 — Commit

```bash
git add docs/decisions/
git commit -m "docs: record decision YYYY-MM-<slug> (issue #N)"
```

Report the committed file path to the user.

## Common Mistakes

- **Silently skipping unrecognised supersession filenames** — if the user types a
  filename not found in `docs/decisions/`, warn and re-prompt. Never silently skip.
- **Using sequential numbering in filenames** — format is `YYYY-MM-<slug>`, not
  `YYYY-NNN-<slug>`. Use year-month prefix only.
- **Forgetting `mkdir -p docs/decisions`** — always create the directory before
  writing, even if it probably exists.
- **Partial commit on supersession** — all modified superseded files must be in the
  same commit as the new ADR. Never commit only the new file.
- **Wrong location for supersession note** — the `> ⚠️ Superseded by ...` line goes
  immediately after the `# YYYY-MM-<slug>` heading, before the blockquote metadata.

## Eval

- [ ] Resolved owner/repo from `git remote get-url origin`
- [ ] Used current year and zero-padded month for filename prefix
- [ ] Presented each field for confirmation with auto-population when in `/token-effort:building-gh-issue` context
- [ ] Prompted all fields interactively when called standalone
- [ ] Scanned `docs/decisions/` for potentially related ADRs and presented shortlist
- [ ] Verified existence of any user-supplied filenames before accepting them
- [ ] Warned and re-prompted when a user-supplied filename was not found
- [ ] When supersession occurred: set Status to `Supersedes [slug](slug.md)` format
- [ ] When supersession occurred: prepended supersession note immediately after heading
- [ ] When supersession occurred: included all modified files in same commit
- [ ] Created `docs/decisions/` directory if it did not exist (`mkdir -p`)
- [ ] Committed with message `docs: record decision YYYY-MM-<slug> (issue #N)`
- [ ] Reported committed file path to user
