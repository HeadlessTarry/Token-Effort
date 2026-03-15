---
name: claude-customiser
description: >
  Domain knowledge for Claude Code customisations: decision framework for
  choosing between agents, skills, CLAUDE.md, rules, and hooks; YAML
  frontmatter schemas for each format; the Shim Pattern for multi-platform
  agents; subagent patterns; tool selection guidance; and targeted reference
  URLs. Make sure to use this skill whenever the user is creating, editing,
  reviewing, or auditing any Claude Code customisation file — including new
  agents, skills, hooks, CLAUDE.md, or rules — even if they don't explicitly
  say "customise".
compatibility: Designed for Claude Code (Anthropic)
---

# Claude Code Customisation — Domain Knowledge

## Decision Framework: Which format to use?

**Always prefer cross-platform formats.** They work across both Claude Code and GitHub Copilot and are the default recommendation for any new customisation.

### Cross-Platform (preferred)

| Format | Use when… | File location |
|---|---|---|
| **Skill** (`SKILL.md`) | You need portable, reusable domain knowledge or a specialised workflow that Claude should load automatically when relevant | `<base dir>/skills/<name>/SKILL.md` |
| **AGENTS.md** | You need always-on instructions that apply across the whole project **or** are scoped to a specific subdirectory | `AGENTS.md` (project root) or `<subdir>/AGENTS.md` |

### Platform-Specific (Claude Code only)

| Format | Use when… | File location |
|---|---|---|
| **Agent** (`.md`) | You need a persistent persona across a conversation, tool restrictions, model preferences, or subagent orchestration | `<base dir>/agents/*.md` |
| **Hook** | You need automated actions triggered by agent lifecycle events | `hooks:` key in `settings.json`, or `hooks:` frontmatter in an agent/skill file |

> Claude agents can be made cross-platform using the Shim Pattern — see Platform-Specific Features below.

---

## Cross-Platform Features

### AGENTS.md — Unified Instructions

`AGENTS.md` is the standard way to provide always-on project instructions. It is recognised by **both Claude Code and GitHub Copilot**, making it the single source of truth for a repository.

#### Placement

| File | Scope |
|---|---|
| `AGENTS.md` at the repository root | Global instructions for the entire project |
| `<subdir>/AGENTS.md` (e.g. `src/AGENTS.md`) | Instructions scoped to that directory and its children only |

Subdirectory `AGENTS.md` files are additive — they layer on top of the root `AGENTS.md`.

### Skill (`SKILL.md`)

```yaml
---
name: skill-name          # must match parent directory name exactly (lowercase, hyphens)
description: >            # used for relevance matching when Claude auto-loads the skill
  What the skill does and when to use it. Be specific about both capabilities
  and use cases.
user-invocable: false     # hide from slash command menu; Claude still auto-loads based on description
disable-model-invocation: true  # prevent auto-loading; only explicit /slash invocation
---
```

The `name` field **must** match the parent directory name exactly or the skill will not load.

> **`user-invocable: false`** hides the skill from the `/` slash command menu but Claude will still load it automatically when the description matches the context.
> **`disable-model-invocation: true`** prevents Claude from loading the skill automatically; it can only be loaded via an explicit `/` invocation. Use this when you want full manual control over when the skill is applied.

---

## Platform-Specific Features

> These formats are Claude Code only. Prefer cross-platform equivalents where possible. If you encounter `CLAUDE.md` or `.claude/rules/` files in a repository, recommend migrating their contents to `AGENTS.md` — see the migration guides below.

### Agent (`.md`)

```yaml
---
name: "Agent Name"
description: "Shown in /agents list; also used to match when Claude auto-selects agents"
model: claude-sonnet-4-6       # optional — pin a specific model; see claude-model-selection skill
tools: [read, write, edit, bash, glob, grep, web_search, agent]  # minimum necessary
disallowedTools: [bash]        # optional — explicitly deny tools
permissionMode: acceptEdits    # optional — default | acceptEdits | dontAsk | bypassPermissions | plan
maxTurns: 10                   # optional — cap agentic turns
skills: [my-skill]             # optional — preload skill content at startup
hooks:                         # optional — lifecycle hooks scoped to this agent only
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/check.sh"
isolation: worktree            # optional — run in isolated git worktree
background: false              # optional — run as background task by default
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
model: claude-sonnet-4-6
tools: [read, edit]
---
Read and follow the agent instructions at: ~/.agents/custom_agents/<name>/<name>.md
```

Shims use `~` (never an expanded absolute path) for cross-OS portability.

### Hooks

Hooks fire automatically on Claude Code lifecycle events without user interaction. They can be configured in two places:

- **`settings.json`** (user `~/.claude/settings.json` or project `.claude/settings.json`) under a `hooks:` key
- **Agent/skill frontmatter** under a `hooks:` key — scoped to that component only

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "echo 'About to run bash'" }]
      }
    ]
  }
}
```

Hook handler types: `command` (shell), `http` (POST to endpoint), `prompt` (LLM eval), `agent` (subagent with tools).

The `matcher` field is a **regex** matched against the tool name. Tool names are capitalised (`Bash`, `Write`, `Edit`, `Read`, `Glob`, `Grep`, `WebFetch`, `WebSearch`, `Agent`). MCP tools use `mcp__<server>__<tool>` naming.

**Hook lifecycle events** (full list):

| Event | When it fires |
|---|---|
| `SessionStart` | Session begins or resumes |
| `InstructionsLoaded` | A CLAUDE.md or rules file loads |
| `UserPromptSubmit` | Before Claude processes the user's prompt |
| `PreToolUse` | Before a tool call executes (can block) |
| `PermissionRequest` | When a permission dialog appears |
| `PostToolUse` | After a tool call succeeds |
| `PostToolUseFailure` | After a tool call fails |
| `Notification` | When a notification is sent |
| `SubagentStart` | When a subagent spawns |
| `SubagentStop` | When a subagent finishes |
| `Stop` | When Claude finishes responding |
| `TeammateIdle` | Before an agent team teammate goes idle |
| `TaskCompleted` | When a task is marked completed |
| `ConfigChange` | When a configuration file changes |
| `PreCompact` / `PostCompact` | Before/after context compaction |
| `WorktreeCreate` / `WorktreeRemove` | When a worktree is created/removed |
| `SessionEnd` | When the session terminates |
| `Elicitation` / `ElicitationResult` | MCP server input requests |

### CLAUDE.md — Migrate to AGENTS.md

`CLAUDE.md` is the Claude-only predecessor to `AGENTS.md`. If found in a repository, recommend migrating to `AGENTS.md`.

No frontmatter. Plain markdown. Content is applied as always-on context for every session in its scope (user-level or project-level). Supports `@path/to/file` imports:

```markdown
# My Project Guidelines

@docs/architecture.md

Always write tests before implementation.
```

**Migration:** Move project-wide instructions into a root `AGENTS.md`. Retain `CLAUDE.md` only for instructions that are genuinely Claude-specific (e.g. referencing hooks, skills, or agent names) and cannot meaningfully apply to other platforms.

### `.claude/rules/` — Migrate to AGENTS.md

`.claude/rules/` is the Claude-only modular rules system. If found in a repository, recommend migrating to `AGENTS.md`.

Rules are `.md` files discovered recursively under `.claude/rules/`. Rules without `paths:` frontmatter load unconditionally; rules with `paths:` load on demand when Claude reads a matching file:

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Rules

- All endpoints must include input validation.
```

User-level rules go in `~/.claude/rules/` and apply to every project.

**Migration:** Move directory-scoped rules into `AGENTS.md` files placed in the relevant subdirectories. Retain `.claude/rules/` files only as a last resort — where the `paths:` glob is essential and cannot be replicated by subdirectory placement.

---

## Base Directory

- To customise Claude Code for a specific project, add files to the `.claude` directory in the root of that project. E.g. `.claude/agents/my-agent.md`, `.agents/skills/my-skill/SKILL.md`, `CLAUDE.md`.
- To share customisations across multiple projects, but only for the current user, add files under the user home directory. E.g. `~/.claude/agents/my-agent.md`, `~/.agents/skills/my-skill/SKILL.md`, `~/.claude/CLAUDE.md`.

## Subagent Pattern

Claude Code only supports **inline subagents** (no handoff buttons). The orchestrator invokes the subagent programmatically via the `agent` tool after user confirmation.

```
Orchestrator:  tools: [..., agent]
Subagent:      description: "...Not intended for direct invocation."
               tools: [read, write, edit]  # scoped to the task only
```

- The full conversation context is available to the subagent when it is invoked.
- Best for: isolated apply phases, parallel analysis, autonomous implementation steps.
- The subagent's `description` is the primary signal for auto-selection — make it clear when direct invocation is not intended.

## Tool Selection

Always keep `tools` to the minimum necessary. Common Claude Code tools:

| Tool | Use for |
|---|---|
| `read` | Read file contents |
| `write` | Create new files |
| `edit` | Modify existing files |
| `bash` | Run shell commands, traverse directories |
| `glob` | Find files by pattern |
| `grep` | Search file contents |
| `web_search` | Search the web for current information |
| `agent` | Invoke a subagent |

## Constraints

- Always keep `tools` to the minimum necessary — no tool should be included unless the workflow requires it.
- Prefer decomposing large, multi-purpose agents into agent + skill.
- The skill `description` is the primary signal Claude uses for relevance matching — make it specific about both what the skill does and when to use it.
- Never add tools, features, or abstractions beyond what the current task requires.

## Targeted Reference URLs

Fetch these only when you need detail on a specific feature. Do not fetch speculatively.

| Need detail on… | URL |
|---|---|
| Agents / subagents overview and format | https://docs.anthropic.com/en/docs/claude-code/sub-agents |
| CLAUDE.md, rules, and memory | https://docs.anthropic.com/en/docs/claude-code/memory |
| Hooks and lifecycle events | https://docs.anthropic.com/en/docs/claude-code/hooks |
| Model selection, identifiers | Load the `claude-model-selection` skill — it contains the full catalogue and task-based guidance |
