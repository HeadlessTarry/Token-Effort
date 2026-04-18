# 🪙 Token Effort

> Low-stakes intelligence for high-latency humans

A collection of Claude Code agents and skills that do just enough to avoid being replaced by a shell script.

## 🚀 Getting Started

```bash
claude plugin marketplace add HeadlessTarry/Token-Effort
claude plugin install token-effort@token-effort
```

After install, Claude Code will list `token-effort` in your active plugins. You'll also need a GitHub Project board - see [github-setup.md](docs/github-setup.md) for more detail.

Skills become `/token-effort:triaging-gh-issues`, `/token-effort:computing-branch-diff`, etc.

## 📚 Documentation Index

### 🎯 Skills

| Skill | Purpose |
|-------|---------|
| [brainstorming-gh-issue](plugins/token-effort/skills/brainstorming-gh-issue/SKILL.md) | Brainstorm GitHub issues, create design specs, refine ideas |
| [building-gh-issue](plugins/token-effort/skills/building-gh-issue/SKILL.md) | Implement issues end-to-end from spec to merged PR |
| [computing-branch-diff](plugins/token-effort/skills/computing-branch-diff/SKILL.md) | Compute changes between branches for reviews and analysis |
| [configuring-dependabot](plugins/token-effort/skills/configuring-dependabot/SKILL.md) | Configure Dependabot for automated dependency updates |
| [init-plus](plugins/token-effort/skills/init-plus/SKILL.md) | Interactive repository setup with CLAUDE.md and workflows |
| [move-issue-status](plugins/token-effort/skills/move-issue-status/SKILL.md) | Move issues between project board statuses |
| [planning-gh-issue](plugins/token-effort/skills/planning-gh-issue/SKILL.md) | Write implementation plans for approved GitHub issues |
| [proposing-feature](plugins/token-effort/skills/propose-feature/SKILL.md) | File new feature requests through guided interview |
| [recording-decisions](plugins/token-effort/skills/recording-decisions/SKILL.md) | Record Architecture Decision Records (ADRs) in docs/decisions |
| [reporting-bug](plugins/token-effort/skills/report-bug/SKILL.md) | File new bug reports through guided interview |
| [reviewing-code-systematically](plugins/token-effort/skills/reviewing-code-systematically/SKILL.md) | Perform comprehensive code reviews on branches or main |
| [triaging-gh-issues](plugins/token-effort/skills/triaging-gh-issues/SKILL.md) | Triage open issues: classify, label, and optionally advance project board status |

### 🤖 Agents

| Agent | Purpose |
|-------|---------|
| [agent-creator-engineer](plugins/token-effort/agents/agent-creator-engineer.md) | Create new or improve existing Claude Code agent definitions |
| [reviewer-dead-code](plugins/token-effort/agents/reviewer-dead-code.md) | Review files for dead code, unused symbols, and stale flags |
| [reviewer-docs](plugins/token-effort/agents/reviewer-docs.md) | Review documentation for quality and accuracy |
| [reviewer-newcomer](plugins/token-effort/agents/reviewer-newcomer.md) | Review source for clarity, comments, assumptions, and error message quality |
| [skill-creator-engineer](plugins/token-effort/agents/skill-creator-engineer.md) | Create new or improve existing skill definitions |

### 🪝 Hooks

Hooks configure automation triggers in [plugins/token-effort/hooks/hooks.json](plugins/token-effort/hooks/hooks.json).

### Standalone Skills

The following skills are embedded within the workflows (see below) and not typically invoked directly:

- **computing-branch-diff** — Used by code review agents to compute and analyze changes between branches
- **reviewing-code-systematically** — Dispatches parallel reviewer agents to evaluate code quality and documentation

## 🔄 Workflows

Common workflows through the plugin ecosystem. Issue status labels (📋 New, 🧠 Brainstorming, 📐 Planning, 🏗️ Building, ✅ Done) correspond to GitHub Project board status columns. Each skill automatically advances the issue status on completion using `/move-issue-status`.

### Repository Initialization

```mermaid
graph LR
    A["Plugin Installed"] --> B["/init-plus"]
    B --> C["Ready for Use"]
```

### Feature Development & Bug Fix Workflow

```mermaid
graph LR
    A1["/propose-feature"]
    A2["/report-bug"]
    DONE["✅ Done"]

    subgraph COL1["📋 New"]
        direction TB
        TRIAGE["/triaging-gh-issues"]
    end

    subgraph COL2["🧠 Brainstorming"]
        direction TB
        BRAIN["/brainstorming-gh-issue"]
        SPEC(["📄 Design Spec"])
    end

    subgraph COL3["📐 Planning"]
        direction TB
        PLAN["/planning-gh-issue"]
        PLANOUT(["📄 Implementation Plan"])
    end

    subgraph COL4["🏗️ Building"]
        direction TB
        BUILD["/building-gh-issue + agents"]
        PR(["📄 Pull Request + Decision Record(s)"])
    end

    A1 --> TRIAGE
    A2 --> TRIAGE
    TRIAGE --> BRAIN
    BRAIN -.-> SPEC
    BRAIN --> PLAN
    PLAN -.-> PLANOUT
    PLAN --> BUILD
    BUILD -.-> PR
    BUILD --> DONE
```

## 🏗️ Structure

```
plugins/token-effort/
├── agents/      →  agent definitions
├── skills/      →  skill definitions
└── hooks/       →  hooks + hook declarations

.claude/skills/run-training/   →  local skill for training evals (not distributed)

training/
└── <type>/<name>/   →  eval cases for the /run-training skill

docs/
└── *.md             →  guides and reference docs
```

**Local vs. Plugin Skills:** Skills in `.claude/skills/` are local to this repository only and are not distributed with the plugin. Plugin skills live in `plugins/token-effort/skills/` and are packaged for distribution.

## 🧪 Training

Skills and agents in this repo can be iteratively improved using the `/run-training` skill, which evaluates definitions against committed test cases and proposes targeted mutations to improve them.

See [docs/training-guide.md](docs/training-guide.md) for the full guide.

## 🏷️ Releases

New versions are published via the [release workflow](.github/workflows/release.yml). Trigger it manually in GitHub Actions with a SemVer version string — it patches `plugin.json`, tags the commit, and creates a GitHub release.

## ➕ Adding Things

Agents go in `plugins/token-effort/agents/<name>.md`. Skills go in `plugins/token-effort/skills/<name>/SKILL.md`. See existing entries for reference.
