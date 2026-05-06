# Always "Pull" Issues Into Status — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every skill responsible for pulling its issue into the corresponding project board column at the point of invocation, removing the push-on-triage `--advance-status` mechanism and removing auto-labels from GitHub issue templates.

**Architecture:** Five targeted text edits across six files — two issue template files, one workflow file, two skill files, and the init-plus skill. No new files are created. No build step exists in this definitions-only repo.

**Tech Stack:** Markdown skill definitions, YAML GitHub Actions workflow, GitHub issue templates.

---

### Task 1: Remove `labels:` from real GitHub issue template files

**Files:**
- Modify: `.github/ISSUE_TEMPLATE/01-feature_request.md:5`
- Modify: `.github/ISSUE_TEMPLATE/02-bug_report.md:5`

- [ ] **Step 1: Read both template files to confirm current content**

  Run:
  ```bash
  cat .github/ISSUE_TEMPLATE/01-feature_request.md
  cat .github/ISSUE_TEMPLATE/02-bug_report.md
  ```
  Confirm both have a `labels:` line in their YAML frontmatter.

- [ ] **Step 2: Remove `labels: enhancement` from the feature request template**

  In `.github/ISSUE_TEMPLATE/01-feature_request.md`, delete the `labels: enhancement` line from the YAML frontmatter. The frontmatter should go from:
  ```
  ---
  name: Feature request
  about: Suggest an idea for this project
  title: ''
  labels: enhancement
  assignees: ''
  ---
  ```
  To:
  ```
  ---
  name: Feature request
  about: Suggest an idea for this project
  title: ''
  assignees: ''
  ---
  ```

- [ ] **Step 3: Remove `labels: bug` from the bug report template**

  In `.github/ISSUE_TEMPLATE/02-bug_report.md`, delete the `labels: bug` line from the YAML frontmatter. The frontmatter should go from:
  ```
  ---
  name: Bug report
  about: Create a report to help us improve
  title: ''
  labels: bug
  assignees: ''
  ---
  ```
  To:
  ```
  ---
  name: Bug report
  about: Create a report to help us improve
  title: ''
  assignees: ''
  ---
  ```

- [ ] **Step 4: Verify both files have no `labels:` line**

  Run:
  ```bash
  grep "^labels:" .github/ISSUE_TEMPLATE/01-feature_request.md
  grep "^labels:" .github/ISSUE_TEMPLATE/02-bug_report.md
  ```
  Both commands must produce no output (the `labels:` line is gone entirely).

- [ ] **Step 5: Commit**

  ```bash
  git add .github/ISSUE_TEMPLATE/01-feature_request.md .github/ISSUE_TEMPLATE/02-bug_report.md
  git commit -m "chore: remove auto-labels from issue templates"
  ```

---

### Task 2: Remove `--advance-status` from the triage workflow

**Files:**
- Modify: `.github/workflows/triaging-gh-issues.yml:33`

- [ ] **Step 1: Read the workflow file to confirm current prompt**

  ```bash
  cat .github/workflows/triaging-gh-issues.yml
  ```
  Confirm line 33 reads:
  ```
              Use the `token-effort-workflow:triaging-gh-issues` skill with `--advance-status`.
  ```

- [ ] **Step 2: Remove `with '--advance-status'` from the prompt field**

  In `.github/workflows/triaging-gh-issues.yml`, find the `prompt:` block. Change:
  ```yaml
          prompt: |
            Use the `token-effort-workflow:triaging-gh-issues` skill with `--advance-status`.
            Triage all open issues in this repository.
  ```
  To:
  ```yaml
          prompt: |
            Use the `token-effort-workflow:triaging-gh-issues` skill.
            Triage all open issues in this repository.
  ```

- [ ] **Step 3: Verify the change**

  ```bash
  grep "advance-status" .github/workflows/triaging-gh-issues.yml
  ```
  Expected: no output (no matches).

- [ ] **Step 4: Commit**

  ```bash
  git add .github/workflows/triaging-gh-issues.yml
  git commit -m "chore: remove --advance-status from triage workflow"
  ```

---

### Task 3: Strip Phase 6b from the triaging skill

**Files:**
- Modify: `plugins/workflow/skills/triaging-gh-issues/SKILL.md`

There are five distinct changes to make to this file. Apply them one at a time and verify after each.

- [ ] **Step 1: Read the skill file to confirm current state**

  Open `plugins/workflow/skills/triaging-gh-issues/SKILL.md` and confirm:
  - Line 13: `**Usage:** \`/triaging-gh-issues [--advance-status]\``
  - Lines 228–239: The Phase 6 close reads "proceed to Phase 6b" and "After Phase 6b completes, report:"
  - Lines 242–257: Phase 6b section exists
  - Lines 277–280: Four Common Mistakes entries mentioning `--advance-status` or `move-issue-status`
  - Lines 311–315: Four Eval items mentioning `--advance-status` or `move-issue-status`

- [ ] **Step 2: Update the Usage line (remove `[--advance-status]` flag)**

  Change:
  ```
  **Usage:** `/triaging-gh-issues [--advance-status]`
  ```
  To:
  ```
  **Usage:** `/triaging-gh-issues`
  ```

- [ ] **Step 3: Fix Phase 6 closing lines**

  Find this block near the end of Phase 6:
  ```
  If any individual call fails, report the failure for that issue and continue processing the remaining issues — do not abort the batch.

  After all label writes complete, proceed to Phase 6b.

  After Phase 6b completes, report:
  ```
  Replace with:
  ```
  If any individual call fails, report the failure for that issue and continue processing the remaining issues — do not abort the batch.

  After all label writes complete, report:
  ```

- [ ] **Step 4: Remove Phase 6b in its entirety**

  Delete the entire Phase 6b section, which begins with:
  ```
  ### Phase 6b — Update GitHub project status
  ```
  and ends after:
  ```
  > **Confidence threshold:** Only issues with confidence **strictly greater than 80%** trigger the project status update. Issues with confidence ≤ 80% skip Phase 6b entirely, even if they belong to exactly one project. This applies equally to `apply`, `reclassify`, and `no-change` issues.
  ```

- [ ] **Step 5: Remove the four `--advance-status` / `move-issue-status` Common Mistakes entries**

  Remove these four bullet points from the Common Mistakes section:
  - `**Updating project status for low-confidence issues** — ...`
  - `**Skipping the project status update for \`no-change\` issues** — ...`
  - `**Updating project status when \`--advance-status\` was not specified** — ...`
  - `**Batch-calling \`token-effort-workflow:move-issue-status\` for multiple issues without executing each sub-skill's phases** — ...`

- [ ] **Step 6: Remove the four `--advance-status` / `move-issue-status` Eval items**

  Remove these four checklist items from the Eval section:
  - `- [ ] If \`--advance-status\` was not specified, Phase 6b was skipped entirely — ...`
  - `- [ ] \`token-effort-workflow:move-issue-status <N>\` (no explicit status) was called for each classified issue ...`
  - `- [ ] Each invocation of \`token-effort-workflow:move-issue-status\` completed in full ...`
  - `- [ ] \`token-effort-workflow:move-issue-status\` was NOT called for issues with confidence ≤ 80%`

- [ ] **Step 7: Verify no `--advance-status` or Phase 6b references remain**

  ```bash
  grep -n "advance-status\|Phase 6b\|move-issue-status" plugins/workflow/skills/triaging-gh-issues/SKILL.md
  ```
  Expected: no output.

- [ ] **Step 8: Commit**

  ```bash
  git add plugins/workflow/skills/triaging-gh-issues/SKILL.md
  git commit -m "feat: remove Phase 6b (--advance-status) from triaging skill"
  ```

---

### Task 4: Add status pull to the brainstorming skill

**Files:**
- Modify: `plugins/workflow/skills/brainstorming-gh-issue/SKILL.md`

Three additions: a new step in Phase 2, a Common Mistakes entry, and an Eval item.

- [ ] **Step 1: Read Phase 2 to identify insertion point**

  Open `plugins/workflow/skills/brainstorming-gh-issue/SKILL.md`. Phase 2 currently ends with state detection (fresh vs re-entry). Find the last line before `### Phase 3`:
  - Fresh path ends: `"Proceed to Phase 3 with the issue title, body, and comments as context. There is no prior spec."`
  - Re-entry ends: `"note the absence and proceed as a fresh brainstorm."`

  The status pull step must go after both detection branches and before Phase 3.

- [ ] **Step 2: Add the status pull step at the end of Phase 2**

  After the detection logic (both the fresh and re-entry sub-sections) and before `### Phase 3`, insert:

  ```markdown
  **Pull issue to Brainstorming status:**

  Invoke `token-effort-workflow:move-issue-status <N> "Brainstorming"` via the Skill tool.
  Non-fatal — if it fails, log a warning and continue to Phase 3.
  ```

- [ ] **Step 3: Add a Common Mistakes entry**

  In the Common Mistakes section, add this bullet point after the existing entries:

  ```markdown
  - **Skipping the status pull in re-entry mode** — `token-effort-workflow:move-issue-status <N> "Brainstorming"` must be called on every invocation, including re-entry. Do not condition it on whether this is a fresh brainstorm.
  ```

- [ ] **Step 4: Add two Eval checklist items**

  In the Eval section, after the existing items and before `- [ ] \`superpowers:brainstorming\` was invoked`, add:

  ```markdown
  - [ ] Invoked `token-effort-workflow:move-issue-status <N> "Brainstorming"` at the end of Phase 2 (non-fatal on failure)
  - [ ] Status pull was called on every invocation, including re-entry mode
  ```

- [ ] **Step 5: Verify the new step is present**

  ```bash
  grep -n "move-issue-status.*Brainstorming\|Brainstorming.*move-issue-status" plugins/workflow/skills/brainstorming-gh-issue/SKILL.md
  ```
  Expected: at least three matches (step text, Common Mistakes, Eval × 2).

- [ ] **Step 6: Commit**

  ```bash
  git add plugins/workflow/skills/brainstorming-gh-issue/SKILL.md
  git commit -m "feat: pull issue to Brainstorming status in brainstorming-gh-issue skill"
  ```

---

### Task 5: Update init-plus generated artefacts

**Files:**
- Modify: `plugins/initialise/skills/init-plus/SKILL.md`

Two sub-changes: the hardcoded workflow template and the hardcoded issue template bodies.

- [ ] **Step 1: Update the hardcoded workflow template (Step 3)**

  Find the `prompt:` block inside the hardcoded `triaging-gh-issues.yml` template in the Step 3 section. It currently reads:
  ```yaml
          prompt: |
            Use the `token-effort-workflow:triaging-gh-issues` skill with `--advance-status`.
            Triage all open issues in this repository.
  ```
  Change to:
  ```yaml
          prompt: |
            Use the `token-effort-workflow:triaging-gh-issues` skill.
            Triage all open issues in this repository.
  ```

- [ ] **Step 2: Update the hardcoded feature request template body (Step 4)**

  Find the embedded feature request template frontmatter inside the Step 4 section. Delete the `labels: enhancement` line so the frontmatter goes from:
  ```
  name: Feature request
  about: Suggest an idea for this project
  title: ''
  labels: enhancement
  assignees: ''
  ```
  To:
  ```
  name: Feature request
  about: Suggest an idea for this project
  title: ''
  assignees: ''
  ```

- [ ] **Step 3: Update the hardcoded bug report template body (Step 4)**

  Find the embedded bug report template frontmatter inside the Step 4 section. Delete the `labels: bug` line so the frontmatter goes from:
  ```
  name: Bug report
  about: Create a report to help us improve
  title: ''
  labels: bug
  assignees: ''
  ```
  To:
  ```
  name: Bug report
  about: Create a report to help us improve
  title: ''
  assignees: ''
  ```

- [ ] **Step 4: Verify no `--advance-status`, `labels: enhancement`, or `labels: bug` remain**

  ```bash
  grep -n "advance-status\|labels: enhancement\|labels: bug" plugins/initialise/skills/init-plus/SKILL.md
  ```
  Expected: no output.

- [ ] **Step 5: Commit**

  ```bash
  git add plugins/initialise/skills/init-plus/SKILL.md
  git commit -m "chore: update init-plus generated artefacts to remove --advance-status and auto-labels"
  ```

---

### Task 6: Full verification pass

- [ ] **Step 1: Verify triaging-gh-issues/SKILL.md — no `--advance-status`, no Phase 6b, no `move-issue-status`**

  ```bash
  grep -c "advance-status\|Phase 6b\|move-issue-status" plugins/workflow/skills/triaging-gh-issues/SKILL.md
  ```
  Expected output: `0`

- [ ] **Step 2: Verify brainstorming-gh-issue/SKILL.md — status pull present with non-fatal note, Common Mistakes entry, and Eval items**

  ```bash
  grep -c "move-issue-status.*Brainstorming\|Brainstorming.*move-issue-status" plugins/workflow/skills/brainstorming-gh-issue/SKILL.md
  ```
  Expected: `3` or more (step, Common Mistakes entry, Eval item × 2).

  ```bash
  grep -c "Non-fatal" plugins/workflow/skills/brainstorming-gh-issue/SKILL.md
  ```
  Expected: `1` or more.

- [ ] **Step 3: Verify real issue templates have no `labels:` line**

  ```bash
  grep "^labels:" .github/ISSUE_TEMPLATE/01-feature_request.md .github/ISSUE_TEMPLATE/02-bug_report.md
  ```
  Expected: no output (the `labels:` line has been removed from both files).

- [ ] **Step 4: Verify triage workflow has no `--advance-status`**

  ```bash
  grep "advance-status" .github/workflows/triaging-gh-issues.yml
  ```
  Expected: no output.

- [ ] **Step 5: Verify init-plus has no `--advance-status`, `labels: enhancement`, or `labels: bug`**

  ```bash
  grep "advance-status\|labels: enhancement\|labels: bug" plugins/initialise/skills/init-plus/SKILL.md
  ```
  Expected: no output.
