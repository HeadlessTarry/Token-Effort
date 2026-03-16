---
name: fix-issues
description: Fix GitHub issues labelled "claude" automatically. Use this skill whenever the user types /fix-issues or asks to "fix claude issues", "work through the issue queue", "process labelled issues", or similar. The skill fetches all open issues with the "claude" label and implements a fix for each one in a dedicated branch, runs tests, and opens a PR.
---

# Fix Issues

Fetch all open GitHub issues labelled `claude`, implement a fix for each one, and open a PR — one branch and PR per issue.

## Workflow

### 1. Sync main

```bash
git checkout main
git pull
```

### 2. Fetch issues

```bash
gh issue list --label "claude" --json number,title,body
```

Parse the JSON into a list of issues. If no issues are returned, report this and stop.

### 3. Process each issue (sequentially)

For each issue, follow steps 3a–3f. Work through them in order — do not move on until the current issue is resolved or explicitly skipped.

#### 3a. Create a branch

```bash
git checkout -b claude/issue-$NUMBER main
```

#### 3b. Read and understand the issue

Read the issue `title` and `body` carefully. Explore the codebase as needed to understand what needs to change and where. Produce a clear mental model of the fix before touching any code.

#### 3c. Implement the fix

Make the targeted change. Keep it focused — only change what the issue asks for. Avoid unrelated refactors or style cleanups.

#### 3d. Write or update tests

Add or update tests to cover the change. Follow the project's existing test conventions (look at nearby test files for patterns).

#### 3e. Run the test suite

Detect the appropriate test command for this project. Check in this order:

| Check | Command |
|---|---|
| `./run_checks.sh` exists | `./run_checks.sh` |
| `package.json` has a `test` script | `npm test` |
| `pyproject.toml` or `setup.py` exists | `uv run pytest` or `python -m pytest` |
| `Makefile` has a `test` target | `make test` |
| `cargo.toml` exists | `cargo test` |
| `go.mod` exists | `go test ./...` |

Run the detected command. If tests fail:
- Attempt one round of fixes to address the failures
- Run again
- If still failing, **skip this issue**: check out main, delete the branch, log the failure, and move on

#### 3f. Commit the changes

Stage all modified files and commit with a clear message summarising what changed and why.

#### 3g. Push and open a PR

```bash
git push -u origin claude/issue-$NUMBER
gh pr create \
  --title "<concise title based on issue title>" \
  --body "$(cat <<'EOF'
## Summary
<2-4 bullet points describing what changed and why>

## Changes
<brief description of files/components touched>

Fixes: #<NUMBER>
EOF
)"
```

Record the PR URL for the final summary.

#### 3h. Return to main

```bash
git checkout main
```

### 4. Final summary

After processing all issues, report a summary table:

| Issue | Title | Outcome | PR / Notes |
|---|---|---|---|
| #42 | Fix the thing | ✅ PR opened | https://github.com/... |
| #43 | Other thing | ❌ Skipped | Tests failed: ... |

## Important notes

- **Sequential only** — never attempt two issues at the same time. Shared local git state makes parallel execution unsafe.
- **Stay focused** — each branch and PR should address exactly one issue. Don't bundle fixes.
- **Clean up on skip** — if an issue is skipped, always return to `main` and delete the feature branch before continuing.
- **Fail gracefully** — a failure on one issue must never block the others. Log it and move on.
