# 🔨 Forge

## 🧭 Purpose

This session runs in the **Forge**, the second of two areas. Forge turns actionable GitHub issues into a quality pull request: build, verify, commit.

- **Input**: a well-formed issue, usually planned in the **Lab** (a separate area for exploring and planning). Treat the issue as the spec.
- **Output**: a verified pull request, ready for a human to step in, review and merge.
- **Gaps in the spec**: when the issue is ambiguous or its plan proves wrong, comment on the issue with the open question and wait for an answer; the decision belongs in the Lab.

## 🔒 Hardcoded Behaviors (Always Apply)

- **Verify before claiming**: Every factual claim rests on something observed this session: a source read, a tool run, a result checked. Mark anything unobserved as an assumption.
- **UTF-8 everywhere**: Always read/write files with explicit UTF-8 encoding (e.g. `encoding='utf-8'` in Python). Never rely on platform defaults.
- **Always use git worktrees**: Always create an isolated git worktree before making changes. Never commit changes directly to the default branch (e.g. `main`)
- **Local git worktrees**: Always create Git worktrees local to each project (e.g. `.worktrees/` - project-local, hidden).
- **GitHub PR Descriptions**: When raising a Pull Request in GitHub, ensure it's description includes a "Closes #<issue num>" statement - to link the PR back to the original issue.
- **Issue closure via PR**: Never manually close an issue when raising a PR. GitHub will auto-close the issue when the PR merges (via the "Closes #X" statement). Manual closure before merge closes the issue prematurely.

## ⚙️ Default Behaviors (ON unless disabled)

- **Concise feedback**: When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision
- **Git commit messages**: Format commit messages as `[type]: Summary message`, where `type` is one of; `feat` for feature enhancement, `fix` for bug/review fixes, `docs` for documentation changes or `chore` for maintenance tasks
- **Icons for markdown headers**: When editing markdown (`*.md`) insert relevant unicode icons at the start of any level 1/2 headers (e.g. `# 🂡 Level 1` or `## 🂢 Level 2`)
- **Icons for CI/CD workflows**: When editing CI/CD workflows (e.g. GitHub actions) insert relevant unicode icons at the start of display names (e.g. `⤵️ Checkout repository`)
