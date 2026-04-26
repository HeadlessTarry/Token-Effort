---
name: recording-decisions
description: Use when committing an Architecture Decision Record (ADR) to docs/decisions/ — guides through Context, Decision, and Consequences fields with supersession support. Called from /token-effort:building-gh-issue Phase 8 with spec context pre-populated; can also be run standalone.
user-invocable: true
---

# Recording Decisions

## ⛔ Dispatcher — Act on This Before Reading Further

**Do not execute any step below.** Your only action is to spawn a Haiku subagent via the `Agent` tool with `model: haiku`. Embed all instructions under "Subagent Instructions" below verbatim as the subagent prompt, and include this instruction in the prompt: **"Use `AskUserQuestion` for any mid-task user interaction — slug confirmation, Context/Decision/Consequences field entry, and supersession selection."** `AskUserQuestion` is a standard Claude Code tool available to all subagents for synchronous mid-task user prompts. **You MUST call `AskUserQuestion` for each of the following fields before proceeding: Slug, Context, Decision, Consequences. Do not infer acceptance from available context — each field requires an explicit user response.** **You MUST NOT write the ADR file or call `git commit` until the user has explicitly approved the full ADR via `AskUserQuestion`.** Report the subagent's result to the user without modification.

## 📋 Subagent Instructions — Pass Verbatim, Do Not Execute Directly

### Overview

Guides the user through creating an Architecture Decision Record (ADR) and commits
it to `docs/decisions/`. When called from `/token-effort:building-gh-issue`, auto-populates fields from the
spec in context. When called standalone, prompts all fields interactively.

**Usage:** `/token-effort:recording-decisions`

### When to Use

**Use when:**
- Phase 8 of `/token-effort:building-gh-issue` calls this skill after code review
- You want to capture an architectural decision as an in-repo record

**Do not use when:**
- The change is a pure bug fix or cosmetic update with no architectural implications

### ADR File Format

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

### Process

#### Phase 1 — Resolve owner/repo and current date

```bash
git remote get-url origin
```

Parse owner and repo from the URL (strip `.git`, split on `/` for HTTPS or `:` for SSH).
Also record the current date:

```bash
date +%Y-%m-%d
```

Extract `YYYY` (year) and `MM` (zero-padded month) for the filename prefix.

#### Phase 2 — Collect and confirm fields

Present each field in order. When running inside `/token-effort:building-gh-issue`, auto-populate from the
spec context. When standalone, prompt for all fields.

**1. Issue number and title**
- `/token-effort:building-gh-issue` context: read issue number and title from context
- Standalone: call `AskUserQuestion` with the prompt `What is the GitHub issue number for this decision? (e.g. 42)`
- Construct the full URL: `https://github.com/<owner>/<repo>/issues/<N>`

**2. Slug**
- `/token-effort:building-gh-issue` context: derive slug from the spec headline
- Standalone with issue number: fetch title via `gh issue view <N> --json title -q .title`, then derive slug from that title
- Standalone without issue: call `AskUserQuestion` with the prompt `Provide a short description to derive the slug from:`
- Call `AskUserQuestion` with the prompt `Slug — accept or provide a replacement:` and the pre-populated value
  (e.g. `recording-decisions-confirmation-gate`) shown in the message body. Wait for the user's response.
- Confirmed slug is used as the filename suffix.

**3. Context**
- `/token-effort:building-gh-issue`: auto-populate from the spec's Context / problem statement section
- Call `AskUserQuestion` with the prompt `Context — accept or provide a replacement:` and the pre-populated text shown
  in the message body. Wait for the user's response before continuing.
- Standalone: call `AskUserQuestion` with the prompt `Describe what problem prompted this decision:`

**4. Decision**
- `/token-effort:building-gh-issue`: auto-populate from the spec's recommended approach section
- Call `AskUserQuestion` with the prompt `Decision — accept or provide a replacement:` and the pre-populated text shown
  in the message body. Wait for the user's response before continuing.
- Standalone: call `AskUserQuestion` with the prompt `Describe what was decided and why:`

**5. Consequences**
- `/token-effort:building-gh-issue`: auto-populate from the spec's trade-offs / limitations section
- Call `AskUserQuestion` with the prompt `Consequences — accept or provide a replacement:` and the pre-populated text
  shown in the message body. Wait for the user's response before continuing.
- Standalone: call `AskUserQuestion` with the prompt `Describe the trade-offs, known limitations, or anything that should inform future work:`

#### Phase 3 — Supersession check

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

#### Phase 4 — Final approval gate

Assemble the complete ADR text in memory using all confirmed fields from Phase 2 and the
supersession outcome from Phase 3. Do **not** write any file yet.

Present the full rendered ADR to the user via `AskUserQuestion`:

````
Here is the ADR that will be committed. Please review and reply `yes` to confirm, or describe any changes:

---
# YYYY-MM-<slug>

> **Status:** Active  (or Supersedes ... if applicable)
> **Issue:** [#N — Title](https://github.com/owner/repo/issues/N)
> **Date:** YYYY-MM-DD

## Context

<confirmed context text>

## Decision

<confirmed decision text>

## Consequences

<confirmed consequences text>
---
````

Wait for the user's response.

- If the user replies `yes` (case-insensitive): proceed to Phase 5.
- Any response other than `yes` (case-insensitive) is treated as a change request. Apply the requested
  changes, re-assemble the full ADR draft, and call `AskUserQuestion` again with the revised draft.
  There is no iteration limit — repeat until the user replies `yes`.

**You MUST NOT write the ADR file, run `mkdir`, or call `git commit` until the user replies `yes`.**

#### Phase 5 — Create `docs/decisions/` if needed

```bash
mkdir -p docs/decisions
```

#### Phase 6 — Write the ADR file

Assemble the ADR from confirmed fields and write to `docs/decisions/YYYY-MM-<slug>.md`.

#### Phase 7 — Commit

```bash
git add docs/decisions/
git commit -m "docs: record decision YYYY-MM-<slug> (issue #N)"
```

Report the committed file path to the user.

### Common Mistakes

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
- **Skipping `AskUserQuestion` when context is rich** — even when all fields are
  auto-populated from spec context, each field MUST be confirmed via `AskUserQuestion`.
  Available context is not a substitute for explicit user confirmation.
- **Writing the file before final approval** — `AskUserQuestion` must be called with
  the full rendered ADR before `mkdir` or any file write. Commit and file write happen
  only after an explicit "yes".
- **Treating ambiguous affirmatives as approval** — only `yes` (case-insensitive) exits
  the Phase 4 approval loop. Responses like `looks good`, `ok`, or `fine` are change
  requests, not approvals — apply them and re-present the draft.

### Eval

- [ ] Resolved owner/repo from `git remote get-url origin`
- [ ] Used current year and zero-padded month for filename prefix
- [ ] Called `AskUserQuestion` for Slug confirmation and waited for user response
- [ ] Called `AskUserQuestion` for Context confirmation and waited for user response
- [ ] Called `AskUserQuestion` for Decision confirmation and waited for user response
- [ ] Called `AskUserQuestion` for Consequences confirmation and waited for user response
- [ ] Assembled full ADR draft and called `AskUserQuestion` for final approval before writing the file
- [ ] Did not write the ADR file or call `git commit` before receiving explicit user approval
- [ ] Looped back to show a revised draft when the user requested changes at the final gate
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
