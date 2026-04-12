# 🪙 Token Effort

> Low-stakes intelligence for high-latency humans

A collection of Claude Code agents and skills that do just enough to avoid being replaced by a shell script.

## 🚀 Getting Started

```bash
claude plugin marketplace add HeadlessTarry/Token-Effort
claude plugin install token-effort@token-effort
```

Skills become `/token-effort:triaging-gh-issues`, `/token-effort:computing-branch-diff`, etc.

## 🏗️ Structure

```
plugins/token-effort/
├── agents/      →  agent definitions
├── skills/      →  skill definitions
└── hooks/       →  hooks + hook declarations

.claude/skills/run-training/   →  local skill (training evals live in this repo)

training/
└── <type>/<name>/   →  eval cases for the /run-training skill

docs/
└── *.md             →  guides and reference docs
```

## 🧪 Training

Skills and agents in this repo can be iteratively improved using the `/run-training` skill, which evaluates definitions against committed test cases and proposes targeted mutations to improve them.

See [docs/training-guide.md](docs/training-guide.md) for the full guide.

## 🏷️ Releases

New versions are published via the [release workflow](.github/workflows/release.yml). Trigger it manually in GitHub Actions with a SemVer version string — it patches `plugin.json`, tags the commit, and creates a GitHub release.

## ➕ Adding Things

Agents go in `plugins/token-effort/agents/<name>.md`. Skills go in `plugins/token-effort/skills/<name>/SKILL.md`. See existing entries for reference.
