# 🪙 Token Effort

> Low-stakes intelligence for high-latency humans

A complementary skill pack that supplements [Matt Pocock's skills ecosystem](https://github.com/mattpocock/skills) with GitHub-specific workflows.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=HeadlessTarry_Token-Effort&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=HeadlessTarry_Token-Effort)

## 📦 What is Token-Effort?

Token-Effort provides 4 skills that complement the MP ecosystem:

| Skill | Purpose |
|-------|---------|
| `/repo-setup` | Interactive onboarding for the MP ecosystem (fresh repos or migrations) |
| `/propose-feature` | Guides feature proposals with structured issue creation |
| `/report-bug` | Guides bug reports with structured issue creation |
| `/configuring-dependabot` | Configures Dependabot for automated dependency updates |

These skills fill gaps in the MP ecosystem for GitHub-specific workflows that MP doesn't cover.

## ⤵️ Installation

Install using `npx skills`:

```bash
npx skills add HeadlessTarry/Token-Effort
```

This installs all 4 Token-Effort skills into your OpenCode skills directory.

### Recommended: Install MP Skills First

For the complete experience, install the MP skills ecosystem first:

```bash
npx skills add mattpocock/skills
npx skills add HeadlessTarry/Token-Effort
```

Then run `/repo-setup` to complete your onboarding (issue templates, Dependabot, labels, etc.).

## 🚀 Quick Start

1. **Set up your repository:**
   ```bash
   /repo-setup
   ```
   This interactive skill walks you through:
   - Installing MP skills (if not already installed)
   - Installing Token-Effort skills
   - Configuring GitHub labels for the MP triage workflow
   - Creating issue templates
   - Setting up Dependabot

2. **Configure MP skills for your repo:**
   ```bash
   /setup-matt-pocock-skills
   ```
   This sets up your issue tracker, triage labels, and domain docs.

3. **Start using the skills:**
   - `/triage` — Triage a new issue (adds labels, detects duplicates, routes to agent/human)
   - `/implement` — Implement a feature or fix from a spec or ticket
   - `/code-review` — Review code changes since a commit, branch, or PR
   - `/propose-feature` — Propose a new feature with structured issue creation
   - `/report-bug` — Report a bug with structured issue creation

## 🔄 The Workflow

Token-Effort uses MP's **label-based state tracking** instead of a project board:

```
needs-triage → needs-info (if clarification needed)
            → ready-for-agent (if AI can handle it)
            → ready-for-human (if human implementation needed)
            → wontfix (if out of scope)
```

### Typical Flow

1. **Issue opened** → labeled `needs-triage` (via issue template)
2. **Run `/triage`** → categorizes, detects duplicates, routes appropriately
3. **Run `/implement`** → builds the feature or fix
4. **Run `/code-review`** → reviews the changes
5. **Merge PR** → done!

## 📋 Prerequisites

- [OpenCode](https://opencode.ai) — AI-assisted development platform
- [gh CLI](https://cli.github.com/) — authenticated with `gh auth login` (for GitHub operations)
- [Node.js](https://nodejs.org/) — for `npx skills`

## 🗂️ Directory Structure

```
skills/              → OpenCode skill definitions
  repo-setup/        → Onboarding skill
  propose-feature/   → Feature proposal skill
  report-bug/        → Bug report skill
  configuring-dependabot/ → Dependabot configuration skill
.opencode/skills/    → Project-local skills (not distributed)
  agent-skill-crafter/ → Create new skills
  run-training/      → Iteratively improve skills via training evals
docs/                → Documentation
  adr/               → Architectural Decision Records
  github-setup.md    → GitHub setup guide
```

## 🧪 Development

### Project-Local Skills

Token-Effort uses two project-local skills for development (in `.opencode/skills/`):

- `agent-skill-crafter` — Create and iterate on new skills
- `run-training` — Run training evals to improve skill definitions

These are not distributed with the package but are available when working on Token-Effort itself.

### Running Tests

Token-Effort uses training evals to test skill behavior. See `docs/training-guide.md` for details.

## 📚 Documentation

- [GitHub Setup Guide](docs/github-setup.md) — Configure labels, secrets, and workflows
- [Training Guide](docs/training-guide.md) — How to write and run training evals
- [Architectural Decision Records](docs/adr/) — Design decisions and rationale

## 🤝 Contributing

Contributions welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run training evals if you've modified a skill
5. Submit a pull request

For major changes, please open an issue first to discuss the proposed changes.

## 📄 License

This project is open source and available under the MIT License.
