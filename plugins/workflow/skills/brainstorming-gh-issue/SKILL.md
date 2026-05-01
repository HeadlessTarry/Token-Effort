---
name: brainstorming-gh-issue
description: Use when the user wants to brainstorm a GitHub issue, turn a rough idea into a design spec, or continue refining a previously brainstormed issue.
user-invocable: true
---

# 🧠 Brainstorm a GitHub Issue

## 🌐 Overview

Fetches a GitHub issue (title, body, and comments), injects the content as context, then invokes `superpowers:brainstorming` to run an interactive design session. After the user approves the spec, posts it as a comment on the issue and applies the `pending-review` label.

**Usage:** `/brainstorming-gh-issue [<issue-number>]`

## ⚙️ When to Use

**Use when:**
- You want to brainstorm a GitHub issue and produce a design spec
- You want to continue refining a previously brainstormed issue (re-entry mode)

**Do not use when:**
- You want to brainstorm something not tied to a GitHub issue — use `superpowers:brainstorming` directly instead

## Prerequisites

The `gh` CLI must be authenticated and available in the session. All GitHub operations use `gh` commands via Bash. No MCP tools are used or required.

> **Important:** Do **not** use MCP tools (`mcp__plugin_github_github__*`) for any issue operation, even if they appear to be available.

> **Shell expansion:** Never use `${VARIABLE}` or any `${...}` form in bash commands. Claude Code's sandbox blocks these. Use `printenv VARIABLE` to read environment variables.

## Process

### Phase 1 — Resolve the issue

**Check args first:** If an issue number was provided as an argument (e.g. `/brainstorming-gh-issue 28` or `/brainstorming-gh-issue #28`), extract it and strip any leading `#`. That is the resolved issue number. Skip to Phase 2.

**If multiple issue numbers were passed as args** (e.g. `/brainstorming-gh-issue 28 29`), ask the user to choose exactly one before continuing:

> "I found multiple issue numbers: 28, 29. Which one should I brainstorm?"

Wait for the user's response. Use the chosen number. Do not fetch any issue until the user has selected one.

**Auto-detect from branch:** If no args were provided, run:

```bash
git branch --show-current
```

Extract the **first** sequence of digits from the branch name. Examples:
- `28-some-feature` → `28`
- `feature/28-foo` → `28`
- `fix/28` → `28`
- `28-29-migrate-auth` → `28` (first only; do not ask the user to choose)
- `main` → no match

**If no issue number can be determined** (no args, and no digits in the branch name), stop with:

> "No issue number found in args or branch name. Run as `/brainstorming-gh-issue <N>`."

### Phase 2 — Fetch context and detect state

Fetch the issue:

```bash
gh issue view <N> --json number,title,body,comments,labels
```

This returns a JSON object with `number`, `title`, `body`, `comments` (array of objects with `body` and `author`), and `labels` (array of objects with `name`).

**Check whether `pending-review` appears in the labels array:**

- **No `pending-review` label → fresh brainstorm.**
  Proceed to Phase 3 with the issue title, body, and comments as context. There is no prior spec.

- **Has `pending-review` label → re-entry mode.**
  Search all entries in the `comments` array for one whose `body` starts with the marker `<!-- brainstorming-gh-issue:spec -->`.

  - **Spec comment found:** extract the full body as the prior spec. This is a continuation — load both the issue context and the prior spec into Phase 3.
  - **No spec comment found** (label added manually): note "The `pending-review` label was present but no prior spec comment was found. Starting fresh." and proceed as a fresh brainstorm.

### Phase 3 — Handoff to `superpowers:brainstorming`

Format the issue context as follows:

```
## GitHub Issue #<N>: <title>

<body>

### Comments

**<author.login>:** <comment body>

**<author.login>:** <comment body>
```

If re-entry mode and a prior spec was found, append:

```
## Prior Design Spec

<prior spec body>
```

Inject this block into the conversation, then invoke `superpowers:brainstorming` with the following instructions:

- Treat the issue content above as the user's starting brief. Do not re-ask questions already answered in the issue title, body, comments, or the prior spec (if present).
- Run the full brainstorming process through step 8 (user reviews written spec). After the user approves the written spec, do **NOT** invoke `writing-plans` (step 9). Proceed to Phase 4 of this skill instead.
- When you reach step 6 (write design doc), call `ExitPlanMode` (Claude Code's built-in tool for leaving plan mode) first, then write the spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`. Do not write to the plan file location (`~/.claude/plans/<name>.md`), even if plan mode was active when this skill was invoked. Do not re-enter plan mode after step 6.
- Do not commit the spec file to git during step 6. Write it to disk and leave it uncommitted (untracked).

Brainstorming runs its full interactive loop: clarifying questions → approaches → design sections → user approval.

After the user approves the written spec, proceed to Phase 4.

### Phase 4 — Post spec and apply label

#### Pre-step — Locate and read the spec file

Brainstorming will have written the spec to `docs/superpowers/specs/`. Find the most recently created file:

```bash
ls -t docs/superpowers/specs/*.md | head -1
```

Read the file content. Use this content as the spec body in step 4a. Do **not** reconstruct the spec from memory.

#### Step 4a — Post spec as a GitHub comment

Take the spec file content and post it to the issue as a comment using this exact format:

```
<!-- brainstorming-gh-issue:spec -->
## 🤖🧠 Design Spec

<approved design content>

---
*AI-generated design spec. Mistakes do happen — please review carefully before approving.*

**To approve this spec:** remove the `pending-review` label and move the issue to the next status on the project board.
```

Run:

```bash
gh issue comment <N> --body "<formatted spec>"
```

#### Step 4b — Ensure the `pending-review` label exists

Run:

```bash
gh label list
```

If `pending-review` does not appear in the output, create it:

```bash
gh label create "pending-review" --color "#FEF2C0" --description "Spec posted, awaiting human approval"
```

#### Step 4c — Apply the label

```bash
gh issue edit <N> --add-label "pending-review"
```

#### Step 4d — Clean up the local spec file

Delete the spec file brainstorming wrote:

```bash
rm <spec-file-path>
```

Do **not** run `git rm` or make a commit. The spec file was untracked (brainstorming did not commit it), so plain `rm` is correct. No cleanup commit is needed.

After Phase 4 completes, report:

> "Done. Spec posted to issue #<N> and labelled `pending-review`."

## Common Mistakes

- **Using MCP tools for issue operations** — all issue interactions must use `gh` CLI commands. Never call any `mcp__plugin_github_github__*` tool, even if it is available.
- **Invoking `writing-plans` after the user approves the spec** — the Phase 3 handoff instructs brainstorming to stop after step 8. Do not invoke `writing-plans` (step 9); proceed to Phase 4 instead.
- **Not reading the spec file before posting** — always locate and read the file brainstorming wrote with `ls -t docs/superpowers/specs/*.md | head -1`. Do not reconstruct the spec content from memory.
- **Forgetting to clean up the local spec file** — after posting to GitHub, run `rm <spec-file-path>` to remove the untracked spec file. Do not use `git rm` and do not commit.
- **Posting the spec before the user approves it** — Phase 4 must not run until the user has explicitly approved the design within the brainstorming session. Do not call `gh issue comment` or `gh issue edit` during Phase 3.
- **Forgetting the HTML comment marker** — the spec comment must begin with `<!-- brainstorming-gh-issue:spec -->` on its own line so future re-entry runs can locate it reliably.
- **Creating `pending-review` without checking first** — always run `gh label list` before `gh label create` to avoid an error if the label already exists.
- **Re-asking questions answered in the issue** — the issue title, body, and comments are the starting brief. Instruct brainstorming not to repeat questions already answered there.
- **Using shell expansion syntax** — never use `${VARIABLE}`, `${VARIABLE:-}`, or any `${...}` form. Claude Code's sandbox blocks these. Use `printenv VARIABLE` to read environment variables.
- **Asking the user to choose when no choice is needed** — branch name auto-detection always uses the first integer. Only ask the user to choose when multiple numbers were explicitly provided as arguments.
- **Making unexpected git commits** — `brainstorming-gh-issue` must never run `git add` or `git commit` directly, and must instruct brainstorming not to commit the spec file. The spec file is left untracked after step 6. No cleanup commit is made in Phase 4.
- **Using `git rm` to remove the spec file** — the spec file is untracked when Phase 4 runs (brainstorming did not commit it). Use plain `rm`, not `git rm`. Running `git rm` on an untracked file will fail.
- **Writing the spec to the plan file location** — even if plan mode is active when this skill is invoked, brainstorming must call `ExitPlanMode` at step 6 and write to `docs/superpowers/specs/`, not to `~/.claude/plans/<name>.md`.

## Eval

- [ ] Resolved a single issue number from args (with or without `#` prefix) without calling `git branch --show-current`
- [ ] When no args given: called `git branch --show-current` and extracted the first integer from the branch name
- [ ] When no args given and branch has no digits: stopped with a message containing the suggested invocation `/brainstorming-gh-issue <N>`
- [ ] When multiple issue numbers given as args: asked the user to choose one before fetching any issue
- [ ] Fetched the issue with `gh issue view --json number,title,body,comments,labels`
- [ ] Identified the absence of `pending-review` label and proceeded as a fresh brainstorm
- [ ] Identified the presence of `pending-review` label and searched comments for `<!-- brainstorming-gh-issue:spec -->`
- [ ] In re-entry mode with spec found: loaded both issue context and prior spec into Phase 3
- [ ] In re-entry mode with no spec found: noted the absence and proceeded as a fresh brainstorm without erroring
- [ ] The Phase 3 handoff instructed brainstorming to stop after step 8 and not invoke `writing-plans`
- [ ] The Phase 3 handoff instructed brainstorming not to re-ask questions answered in the issue or prior spec
- [ ] The Phase 3 handoff instructed brainstorming to call `ExitPlanMode` at step 6 (not before) and write to `docs/superpowers/specs/`
- [ ] The Phase 3 handoff instructed brainstorming not to commit the spec file to git
- [ ] `superpowers:brainstorming` was invoked (not re-implemented inline)
- [ ] `gh issue comment` was NOT called until after the user approved the design
- [ ] `gh issue edit --add-label pending-review` was NOT called until after user approval
- [ ] Phase 4 located the spec file with `ls -t docs/superpowers/specs/*.md | head -1`
- [ ] Phase 4 read the spec file content before constructing the GitHub comment
- [ ] The spec comment body starts with `<!-- brainstorming-gh-issue:spec -->`
- [ ] The spec comment contains the heading `## 🤖🧠 Design Spec`
- [ ] The spec comment footer contains "Mistakes do happen"
- [ ] The spec comment footer contains instructions to remove `pending-review` and advance the project status
- [ ] `gh label list` was called before attempting to create or apply `pending-review`
- [ ] `gh label create "pending-review"` was called only when the label was absent from `gh label list` output
- [ ] `gh issue edit <N> --add-label "pending-review"` was called after the spec comment was posted
- [ ] Phase 4 removed the spec file with plain `rm` (not `git rm`) and made no cleanup commit
- [ ] No `mcp__` tool was called at any point
- [ ] A completion message was shown after Phase 4, referencing the issue number
