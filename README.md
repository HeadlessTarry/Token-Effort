# 🪙 Token Effort

> Low-stakes intelligence for high-latency humans

A set of practical skills for any developer. Use standalone or alongside other skill ecosystems like [Matt Pocock's skills](https://github.com/mattpocock/skills) or [Obra Superpowers](https://github.com/obra/superpowers).

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=HeadlessTarry_Token-Effort&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=HeadlessTarry_Token-Effort)

## 📦 What is Token-Effort?

Token-Effort provides 4 skills for common GitHub workflows:

| Skill | Purpose |
|-------|---------|
| `/repo-setup` | Quick repository setup (issue templates, Dependabot) |
| `/propose-feature` | Guides feature proposals with structured issue creation |
| `/report-bug` | Guides bug reports with structured issue creation |
| `/configuring-dependabot` | Configures Dependabot for automated dependency updates |

These skills are designed to be useful on their own, or as part of a larger skill ecosystem. They don't provide a complete workflow — just the tools you need for common tasks.

## ⤵️ Installation

Install using `npx skills`:

```bash
npx skills add HeadlessTarry/Token-Effort
```

This installs all 4 Token-Effort skills into your OpenCode skills directory.

### Using with Other Skill Ecosystems

Token-Effort works alongside other skill sets:

```bash
# Matt Pocock's skills (optional)
npx skills add mattpocock/skills

# Obra Superpowers (optional)
npx skills add obra/superpowers

# Token-Effort
npx skills add HeadlessTarry/Token-Effort
```

Then run `/repo-setup` to configure issue templates and Dependabot for your repo.

## 🚀 Quick Start

1. **Set up your repository:**
   ```bash
   /repo-setup
   ```
   This interactive skill walks you through:
   - Creating issue templates (feature request, bug report)
   - Configuring Dependabot for dependency updates
2. **Start using the skills:**
   - `/propose-feature` — Propose a new feature with structured issue creation
   - `/report-bug` — Report a bug with structured issue creation
   - `/configuring-dependabot` — Configure Dependabot for automated dependency updates

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
