# 📐 Coding Standards

Judgement calls for the Standards reviewer in `/code-review`. Each rule names its scope; flag a diff that breaks one, quoting the rule's name. Mechanical rules live in [.pre-commit-config.yaml](.pre-commit-config.yaml) (see [docs/running-checks.md](docs/running-checks.md)) and stay out of this file.

## 🤖 Agent-facing docs

Scope: `AGENTS.md`, `config/AGENTS.md`, `skills/**`, `personas/**`, `docs/agents/**`, `config/docs/agents/**`.

- **Positive phrasing.** Apply the Negation guidance in the `writing-for-agents` skill.
- **Actionable instructions.** Every instruction is one the reading agent can carry out from inside its own session, with the tools it has.
- **Safe defaults.** A command shown to an agent leads with its lightest form, heavier variants opt-in; [docs/development_environment.md](docs/development_environment.md) is the reference example.

## 📚 All docs

Scope: every `*.md`.

- **Single source of truth.** Apply the Pruning guidance in the `writing-for-agents` skill: link to the canonical doc, file, or directory.
- **Present state.** Describe what the repo contains today. Mention future tools or plugins only as a scope limit ("scope is limited to X; others may follow").
- **ADR limitations.** Each ADR in `docs/adr/` names the platforms its decision covers and its known limitations.

## 🔐 Config and permissions

Scope: `.github/workflows/**`, `config/settings.json`, skill and agent frontmatter, plugin manifests.

- **Least privilege.** Every permission, tool grant, or allowed command traces to a step that uses it.
- **Established fields.** Use only frontmatter and config fields defined by the consuming tool's schema or already in use in this repo.
