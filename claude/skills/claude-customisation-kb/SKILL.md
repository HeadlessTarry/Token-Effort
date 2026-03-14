---
name: claude-customisation-kb
description: >
  Domain knowledge for Claude Code customisations: decision framework for
  choosing between agents, skills, CLAUDE.md, and hooks; YAML frontmatter
  schemas for each format; subagent patterns; tool selection guidance; and
  targeted reference URLs. Load when creating, editing, reviewing, or auditing
  any Claude Code customisation file.
user-invocable: false
---

# Claude Code Customisation — Domain Knowledge

## Decision Framework: Which format to use?

| Format | Use when… | File location |
|---|---|---|
| **Agent** (`.md`) | You need a persistent persona across a conversation, tool restrictions, model preferences, or subagent orchestration | `<base dir>/agents/*.md` |
| **Skill** (`SKILL.md`) | You need portable, reusable domain knowledge or a specialised workflow that Claude should load automatically when relevant | `<base dir>/skills/<name>/SKILL.md` |
| **CLAUDE.md** | You need always-on instructions applied to every session for a user or project | `~/.claude/CLAUDE.md` (user) or `CLAUDE.md` (project root) |
| **`.claude/rules/`** | You need modular, optionally path-scoped rules that extend CLAUDE.md for a project or user | `<base dir>/rules/*.md` |
| **Hook** | You need automated actions triggered by agent lifecycle events | `hooks:` key in `settings.json`, or `hooks:` frontmatter in an agent/skill file |

**Default: prefer the simplest format.** If no tool restrictions or persistent persona are needed, a skill or CLAUDE.md addition is almost always better than an agent.

## Base Directory

- To customise Claude Code for a specific project, add files to the `.claude` directory in the root of that project. E.g. `.claude/agents/my-agent.md`, `.claude/skills/my-skill/SKILL.md`, `CLAUDE.md`.
- To share customisations across multiple projects, but only for the current user, add files under the user home directory. E.g. `~/.claude/agents/my-agent.md`, `~/.claude/skills/my-skill/SKILL.md`, `~/.claude/CLAUDE.md`.

## Key File Structures

### Agent (`.md`)

```yaml
---
name: "Agent Name"
description: "Shown in /agents list; also used to match when Claude auto-selects agents"
model: claude-sonnet-4-6       # optional — pin a specific model; see claude-model-selection-kb skill
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

### CLAUDE.md

No frontmatter. Plain markdown. Content is applied as always-on context for every session in its scope (user-level or project-level).

Supports `@path/to/file` imports to include content from other files:

```markdown
# My Project Guidelines

@docs/architecture.md

Always write tests before implementation.
```

### `.claude/rules/`

Modular alternative to a monolithic CLAUDE.md. All `.md` files in `.claude/rules/` are discovered recursively and loaded at launch. Rules without `paths:` frontmatter load unconditionally; rules with `paths:` load on demand when Claude reads matching files:

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Rules

- All endpoints must include input validation.
```

User-level rules go in `~/.claude/rules/` and apply to every project.

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
| Model selection, identifiers | Load the `claude-model-selection-kb` skill — it contains the full catalogue and task-based guidance |
