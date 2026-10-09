# 🪙 Token Effort

## 🔒 Hardcoded Behaviors (Always Apply)

- **Verify before claiming**: Every factual claim rests on something observed this session: a source read, a tool run, a result checked. Mark anything unobserved as an assumption.
- **UTF-8 everywhere**: Always read/write files with explicit UTF-8 encoding (e.g. `encoding='utf-8'` in Python). Never rely on platform defaults.
- **Issue as spec**: When building from a GitHub issue, treat the issue as the spec. When it is ambiguous or its plan proves wrong, comment on the issue with the open question and wait for an answer.
- **Always use git worktrees**: Before making changes, create an isolated git worktree local to the project (e.g. `.worktrees/` - project-local, hidden) on a new branch. Never commit directly to the default branch (e.g. `main`)
- **GitHub PR Descriptions**: When raising a Pull Request in GitHub, ensure it's description includes a "Closes #<issue num>" statement - to link the PR back to the original issue.
- **Issue closure via PR**: Never manually close an issue when raising a PR. GitHub will auto-close the issue when the PR merges (via the "Closes #X" statement). Manual closure before merge closes the issue prematurely.

## ⚙️ Default Behaviors (ON unless disabled)

- **Concise feedback**: When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision
- **Git commit messages**: Format the commit summary line as `type: Summary message` (no scope, e.g. `feat: Add installer`), where `type` is one of; `feat` for feature enhancement, `fix` for bug/review fixes, `docs` for documentation changes or `chore` for maintenance tasks
- **Icons for markdown headers**: When editing markdown (`*.md`) insert relevant unicode icons at the start of any level 1/2 headers (e.g. `# 🂡 Level 1` or `## 🂢 Level 2`)
- **Icons for CI/CD workflows**: When editing CI/CD workflows (e.g. GitHub actions) insert relevant unicode icons at the start of display names (e.g. `⤵️ Checkout repository`)

## 🧭 Working Conventions

These conventions are the same in every repo. Repos do not carry their own copies and must not create them.

### Issue tracker

Issues live in GitHub Issues. Where a skill refers to `docs/agents/issue-tracker.md`, use `$AI_CONFIG_DIR/docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Where a skill refers to `docs/agents/triage-labels.md`, use `$AI_CONFIG_DIR/docs/agents/triage-labels.md`.

## 🪟 Windows Shell Gotchas

- **Temp paths**: Git Bash's `/tmp` is not Node's or Python's `/tmp` (they resolve it as `C:\tmp`). Pass paths to them through `cygpath -w`, or use a repo-local temp file.
- **Multi-line edits**: Use the Edit tool for multi-line or quote-heavy replacements; reserve `sed`/`node -e` for single-line, quote-free substitutions.
