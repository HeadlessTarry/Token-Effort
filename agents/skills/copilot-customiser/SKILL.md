---
name: copilot-customiser
description: >
  Domain knowledge for GitHub Copilot customisations: decision framework for
  choosing between agents, skills, prompt files, instruction files, and hooks;
  YAML frontmatter schemas for each format; the Shim Pattern for multi-platform
  agents; subagent read/write separation patterns; tool-loading priority rules;
  and targeted reference URLs. Make sure to use this skill whenever the user
  is creating, editing, reviewing, or auditing any GitHub Copilot
  customisation file — including new agents, skills, prompt files,
  instruction files, or hooks — even if they don't explicitly say
  "customise".
compatibility: Designed for GitHub Copilot (Microsoft)
---

# GitHub Copilot Customisation — Domain Knowledge

## Decision Framework: Which format to use?

**Always prefer cross-platform formats.** They work across both GitHub Copilot and Claude Code and are the default recommendation for any new customisation.

### Cross-Platform (preferred)

| Format | Use when… | File location |
|---|---|---|
| **Agent skill** (`SKILL.md`) | You need portable, reusable domain knowledge or a specialised workflow that Copilot should load automatically when relevant | `<base dir>/skills/<name>/SKILL.md` |
| **AGENTS.md** | You need always-on instructions that apply across the whole project **or** are scoped to a specific subdirectory | `AGENTS.md` (project root) or `<subdir>/AGENTS.md` |

### Platform-Specific (GitHub Copilot only)

| Format | Use when… | File location |
|---|---|---|
| **Custom agent** (`.agent.md`) | You need a persistent persona across a conversation, tool restrictions, model preferences, handoffs, or subagent orchestration | `<base dir>/agents/*.agent.md` |
| **Prompt file** (`.prompt.md`) | You need a lightweight, single-task slash command invoked manually | `<base dir>/prompts/*.prompt.md` |
| **Hook** | You need automated actions triggered by agent lifecycle events (e.g. on file save, on tool call) | `<base dir>/hooks/*.json` |

> Copilot agents can be made cross-platform using the Shim Pattern — see Platform-Specific Features below.

---

## Cross-Platform Features

### AGENTS.md — Unified Instructions

`AGENTS.md` is the standard way to provide always-on project instructions. It is recognised by **both GitHub Copilot and Claude Code**, making it the single source of truth for a repository.

#### Placement

| File | Scope |
|---|---|
| `AGENTS.md` at the repository root | Global instructions for the entire project |
| `<subdir>/AGENTS.md` (e.g. `src/AGENTS.md`) | Instructions scoped to that directory and its children only |

Subdirectory `AGENTS.md` files are additive — they layer on top of the root `AGENTS.md`.

### Agent Skill (`SKILL.md`)

```yaml
---
name: skill-name          # must match parent directory name exactly (lowercase, hyphens)
description: >            # max 1024 chars — Copilot uses this for relevance matching
  What the skill does and when to use it. Be specific about both capabilities
  and use cases.
user-invocable: false     # hide from / menu; model still loads automatically
disable-model-invocation: true  # only allow explicit /slash invocation; model won't auto-load
---
```

The `name` field **must** match the parent directory name exactly or the skill will not load.

> **`user-invocable: false`** hides the skill from the `/` slash command menu but Copilot will still load it automatically when the description matches the context.
> **`disable-model-invocation: true`** goes further — it prevents Copilot from loading the skill automatically; it can only be loaded via an explicit `/` invocation. Use this when you want full manual control over when the skill is applied.

---

## Platform-Specific Features

> These formats are GitHub Copilot only. Prefer cross-platform equivalents where possible. If you encounter `.github/copilot-instructions.md` or `.instructions.md` files in a repository, recommend migrating their contents to `AGENTS.md` — see the migration guides below.

### Custom Agent (`.agent.md`)

```yaml
---
name: "Agent Name"
description: "Shown in agents dropdown"
argument-hint: "Optional input hint"
model: "Claude Sonnet 4.6 (copilot)" # optional — pin a specific model; see copilot-model-selection skill for guidance
tools: ["read", "search", "edit"]    # minimum necessary
agents: ["subagent-name"]            # explicitly set to [] when no subagents are needed
user-invocable: false                # explicitly set to show/hide from picker (false for subagents and handoff targets)
handoffs:
  - label: "Button label"
    agent: "target-agent"
    prompt: "Pre-filled prompt text"
    send: false                      # true = auto-submit
---
```

### Shim Pattern (multi-platform agents)

Use the Shim Pattern when an agent must work across both Claude Code and GitHub Copilot from
a single shared body. Each agent is three files:

| File | Repo path | Installs to | Contents |
|---|---|---|---|
| Body | `agents/custom_agents/<name>/<name>.md` | `~/.agents/custom_agents/<name>/<name>.md` | Platform-agnostic instructions; no frontmatter |
| Claude shim | `claude/agents/<name>.md` | `~/.claude/agents/<name>.md` | Claude frontmatter + one read instruction |
| Copilot shim | `copilot/agents/<name>.agent.md` | `~/.copilot/agents/<name>.agent.md` | Copilot frontmatter + one read instruction |

`install.sh` copies each directory tree to its target: `agents/custom_agents/*` → `~/.agents/custom_agents/*`,
`agents/skills/*` → `~/.agents/skills/*`, `claude/*` → `~/.claude/*`, `copilot/*` → `~/.copilot/*`.

**Shim format** — frontmatter followed by a single instruction pointing at the body:

```markdown
---
name: "Agent Name"
model: "Claude Sonnet 4.6 (copilot)"
tools: ["read", "edit"]
---
Read and follow the agent instructions at: ~/.agents/custom_agents/<name>/<name>.md
```

Shims use `~` (never an expanded absolute path) for cross-OS portability.

### Prompt File (`.prompt.md`)

```yaml
---
description: "Short description"
agent: agent              # ask | agent | plan | <custom-agent-name>
tools: ["read", "edit"]   # overrides the referenced agent's tool list if specified
---
```

### Hook

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "echo 'The session has started!'"
      }
    ]
  }
}
```

Hooks fire automatically on agent lifecycle events without user interaction.

A custom agent can include `hooks:` in its YAML frontmatter to define hooks that apply only to that agent:

```yaml
---
name: "Chatty agent"
description: "Agent that says hi at the start of each session"
hooks:
  SessionStart:
    - type: command
      command: "echo 'Welcome to the session!'"
---
```

### `.github/copilot-instructions.md` — Migrate to AGENTS.md

`.github/copilot-instructions.md` is the Copilot-only predecessor to `AGENTS.md` for global project instructions. If found in a repository, recommend migrating to `AGENTS.md`.

**Migration:** Move its contents into a root `AGENTS.md`. The root `AGENTS.md` is equivalent in scope and is recognised by both Copilot and Claude Code.

### Instruction Files (`.instructions.md`) — Migrate to AGENTS.md

`.instructions.md` files provide Copilot-only, glob-scoped instructions. If found in a repository, recommend migrating to `AGENTS.md`.

```yaml
---
applyTo: "src/**/*.ts"   # glob pattern — omit to apply to all files globally
---
```

**Migration:** Move directory-scoped instructions into `AGENTS.md` files placed in the relevant subdirectories. Retain `.instructions.md` files only as a last resort — where the `applyTo` glob pattern is essential and cannot be replicated by subdirectory placement.

---

## Base Directory

- To customise Copilot for a specific project, add files to the `.github` directory in the root of that project. E.g. `.github/agents/my-agent.agent.md`, `.github/skills/my-skill/SKILL.md`, `.github/prompts/my-prompt.prompt.md`, `.github/instructions/my-instructions.instructions.md`, `.github/hooks/my-hook.json`.
- To share customisations across multiple projects, but only for the current user, add files to under the user home directory. E.g. `~/.copilot/agents/my-agent.agent.md`, `~/.copilot/skills/my-skill/SKILL.md`, `~/.copilot/prompts/my-prompt.prompt.md`, `~/.copilot/instructions/my-instructions.instructions.md`, `~/.copilot/hooks/my-hook.json`.

## Handoffs vs. Inline Subagents

Both patterns enforce a tool boundary between phases (e.g. read-only planning vs. editing). Choose based on whether the user should control the transition.

### Handoffs — user-driven sequential workflows

Use when the user should **review and approve** each phase before the next begins, or when the transition is meaningful enough to surface explicitly.

```yaml
handoffs:
  - label: "Button label"
    agent: "target-agent"
    prompt: |
      Apply the plan exactly as described. Do not deviate from it.
      Create or modify only the files listed.
    send: false   # true = auto-submit without user confirmation
```

Because the `prompt:` field is static (see limitation below), the pattern for passing a dynamic plan through a handoff is a **user action**: the orchestrator should output the plan summary clearly, then instruct the user to copy it into the handoff prompt before clicking the button. The user can review and edit the prompt before confirming.

- The pre-filled prompt is the only context reliably passed to the target agent — make it self-contained.
- Handoff buttons appear after a response completes; the user selects them to advance.
- Best for: plan → implement, implement → review, any workflow where the user wants a checkpoint.

**Limitation:** The `prompt:` field is a static string defined in the agent's YAML — the model cannot dynamically inject content into it at runtime. Avoid designs that require the model to populate the pre-filled prompt with dynamic content (e.g. inserting a generated plan). For workflows that need to pass dynamic context to the target agent, use the inline subagents pattern instead.

**VS Code Limitation** - the tools defined in the orchestrating agent are carried over to other agents via a handoff. This is a necessary exception to the general rule that each agent should only include the minimum necessary tools.

### Inline Subagents — agent-driven delegation within one conversation

Use when the transition is implementation detail the user doesn't need to approve, and the result must be returned to the orchestrator to continue.

- Orchestrator: add "agent" to tools and agents: ["subagent-name"]
- Subagent: user-invocable: false, scoped tools only
- The full conversation context is available to the orchestrator when it invokes the subagent.
- Best for: isolated research, parallel analysis, autonomous apply steps where no checkpoint is needed.

## Tool Loading Priority

When `tools` is declared in both a prompt file and a custom agent, the **prompt file takes precedence**.

## Constraints

- Always keep `tools` to the minimum necessary — no tool should be included unless the workflow requires it.
- Prefer decomposing large, multi-purpose agents into agent + skill + prompts.
- The skill `description` is the primary signal Copilot uses for relevance matching — make it specific about both what the skill does and when to use it.
- Never add tools, features, or abstractions beyond what the current task requires.

## Targeted Reference URLs

Fetch these only when you need detail on a specific feature. Do not fetch speculatively.

| Need detail on… | URL |
|---|---|
| Customisation concepts and capabilities overview | https://code.visualstudio.com/docs/copilot/concepts/customization |
| Always-on instructions | https://code.visualstudio.com/docs/copilot/customization/custom-instructions |
| Reusable prompt files | https://code.visualstudio.com/docs/copilot/customization/prompt-files |
| Custom agents | https://code.visualstudio.com/docs/copilot/customization/custom-agents |
| Subagent invocation and `agents:` field | https://code.visualstudio.com/docs/copilot/agents/subagents |
| Agent skills specification and portability | https://code.visualstudio.com/docs/copilot/customization/agent-skills |
| MCP servers | https://code.visualstudio.com/docs/copilot/customization/mcp-servers |
| Hooks, Agent-scoped hooks and lifecycle events | https://code.visualstudio.com/docs/copilot/customization/hooks |
| Model selection, identifiers, and multipliers | Load the `copilot-model-selection` skill — it contains the full catalogue and task-based guidance |
