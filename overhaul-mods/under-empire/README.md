# 🐀 Under-Empire

The Skaven overhaul mod. Install it with:

```bash
./install.sh --overhaul under-empire
```

| Feature | What it is |
|---------|------------|
| `Warlock Engineer` output style | A scheming Skaven voice for prose; code, commands and artefacts stay plain ([output-styles/warlock-engineer.md](output-styles/warlock-engineer.md)) |
| Reminder hook | A `UserPromptSubmit` command hook that adds [hooks/reminder.txt](hooks/reminder.txt) to every prompt, so the voice holds in long sessions |
| Underlings | A side pane listing running subagents and background tasks as animated Skaven rats (below) |

Claude Code loads one hooks module per plugin, so [hooks/register.ts](hooks/register.ts) registers every mod in `mods/`. Each mod keeps its own source and tests in `mods/<mod>/`, and its `$.state` keys, prefixed `<mod>.`, in the plugin's one contract, [types/index.d.ts](types/index.d.ts).

## 🐀 Underlings

A pane that opens whenever subagents or background tasks are running, and shows each one as an animated, pixel-art Skaven underling in a roster.

| Kind of work | Underling |
|---|---|
| Research (explore, investigate, map, plan) | **Grey Seer** |
| Experiment (spike, prototype, benchmark) | **Apprentice** |
| Building / coding (implement, fix, refactor) | **Tunnel-Sapper** |
| Tests and audits (test, lint, scan, review) | **Eshin Inspector** |
| Anything else | **Clanrat** |

### What it shows

- **Roster:** one row per underling, in three groups: running Subagents, running Background tasks, and Finished (greyed rats with a ✓ done, ✕ failed or ■ stopped badge, most recently finished first). Each row shows its rat, title, elapsed time, role and status, then model and tokens or the command. Each group shows its first 5 rows; **Show all** on a group's heading lists the rest.
- **Click anywhere on a row** to unfold its detail directly beneath it, accordion-style; click it again to fold it away:
  - **Subagent:** model, tokens and a live transcript (text, thinking, tool calls and their results), streamed from the subagent's own model responses.
  - **Background task:** the command and its output, read from the task's output file twice a second.
- **Clear**, on the Finished heading, removes finished underlings. `/underlings` opens the pane by hand.

On the desktop app the rats are animated SVGs; in a terminal each is a single glyph.

### Files

| File | Role |
|---|---|
| `mods/underlings/register.tsx` | The hooks (`agent.spawn`, `turn.step`, `turn.complete`, `tool.call`, `session.append`), the output follower and the Pane drawing |
| `mods/underlings/model.ts` | Pure logic: classification, formatting, and parsers for the engine's messages |
| `mods/underlings/sprites.ts` | The 24×24 rats, baked into self-animating SVG (SMIL) |
| `mods/underlings/row-hit.tsx` | Client module: makes a whole roster row one click target |
| `mods/underlings/tests/` | Unit tests and Pane tests on the terminal and desktop surfaces |

### Known limits

- **Background output is near-live:** the open task's output file is read twice a second. Other running tasks are read one at a time in rotation, so the pane's load stays flat however many tasks run; most finish through the engine's task notification rather than that rotation. No plugin hook streams the output of a shell the engine started.
- **Large output:** `$.fs.read` refuses files over 4 MiB, so past that size the tail is read with `tail`, or with PowerShell's `Get-Content -Tail` for a Windows path, each falling back to the other. Supported on Windows and Linux; macOS is untested.
- **Transcripts unavailable:** agents started by a workflow run, remote agents and teammates in another process cannot be read back; their rows still show.
- **Tokens** are the subagent's context size: the input, cache and output tokens of its latest model request, the same measure as the Agent tool's own `totalTokens`, which replaces it when a foreground subagent completes. Every request resends the whole conversation, so summing requests would count that history once per request.

## 🧪 Develop

[run_checks.sh](../../run_checks.sh) validates the plugin and runs its tests (see [docs/running-checks.md](../../docs/running-checks.md)). After editing, run `/reload-plugins` in a session, and bump `version` in [.claude-plugin/plugin.json](.claude-plugin/plugin.json) as the [README](../../README.md) says.
