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
| Doomwheel | A side pane and status line showing a PR's Auto-Fix Watch and review rounds as a Skaven Doomwheel. Needs the `shepherding-pr-reviews` skill (below) |

Claude Code loads one hooks module per plugin, so [hooks/register.ts](hooks/register.ts) registers every mod in `mods/`. Each mod keeps its own source and tests in `mods/<mod>/`, and its `$.state` keys, prefixed `<mod>.`, in the plugin's one contract, [types/index.d.ts](types/index.d.ts).

The engine takes one hook without a matcher per event from a plugin. Underlings holds those on `session.start`, `tool.call`, `session.append` and `turn.complete`. A later mod hooks those events with a matcher naming what it watches, as Doomwheel does.

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

## ⚙️ Doomwheel

A pane and status line that show a PR's Auto-Fix Watch, and the review rounds the `shepherding-pr-reviews` skill runs on it, as a Skaven Doomwheel: a wooden wheel with a rat running inside, powered by a warpstone crystal.

**It needs the `shepherding-pr-reviews` skill.** Doomwheel stays out of sight until the skill's script first prints for a PR: its pane, status line, toasts and notifications start with that output. Signals seen earlier for that PR, such as `gh pr create` or Auto-Fix being armed, are kept and shown once the wheel appears. A session without the skill sees only the rest of `under-empire`. Doomwheel only watches: the skill works the same with or without it.

### What it shows

The wheel tracks the two limits that cause an Auto-Fix Halt, each with its own look:

| Limit | Gauge | Rising | At the limit |
|---|---|---|---|
| **Noise limit**: 3 noise rounds | **HEAT** ▰▱▱, and the crystal's colour | The crystal glows green, then yellow, orange and red | **Overheated**: the wheel cracks, smokes and burns, and the rat is knocked out |
| **Round limit**: 10 rounds | **ROUNDS** ▰▰▰▱▱▱▱▱▱▱ | The wheel turns slower with every round. From round 7 the rat sweats and the gauge turns amber | **Exhausted**: the wheel stays whole and the rat collapses in a puddle, under an amber glow |

When both limits are reached in the same round, the skill reports the round limit, and so does the wheel.

| Phase | Wheel |
|---|---|
| 📜 Offering laid | PR raised, Auto-Fix not yet armed: the wheel stands still |
| ⚙ Spinning | Auto-Fix armed: the wheel turns and warp-lightning crackles |
| ⚡ Warp-bolt! | A `<ci-monitor-event>` woke the session: the wheel races and lightning strikes. It settles back when the turn ends |
| 💥 Overheated / 🥵 Exhausted / ⛔ Halted | An Auto-Fix Halt. While the Auto-Fix Watch is still on, the card says it must be cut |
| ❄ Cold | Auto-Fix off: the rat sleeps |
| 🏁 Retired | The PR is merged or closed |

- **Pane:** one card per PR, newest first, with the wheel, the HEAT, ROUNDS and THREADS gauges and a **squeak-scroll** of the PR's last events. The pane opens by itself when a wheel first appears or on an Auto-Fix Halt. `/doomwheel` opens it by hand, and **Clear retired** removes cold and retired wheels.
- **Status line:** the most recently active wheel is pinned under the prompt, for example `⚙ Doomwheel #159 · Spinning · heat ▰▱▱ · round 2/10`.
- **Alerts:** a toast when Auto-Fix is armed, and a toast plus a native notification on an Auto-Fix Halt, because that needs your decision.

On the desktop app the wheel is an animated SVG. In a terminal it is drawn as a single glyph.

### What it reads

Every signal comes from the session itself: its tool calls, their output and its messages.

| Signal | Source | Read with |
|---|---|---|
| PR raised | A `gh pr create` Bash or PowerShell call whose output holds the PR URL | `tool.call` |
| Auto-Fix on / off | A `set_monitor` call (`auto_fix`, `url`) and its answer | `tool.call` |
| Wake | A `<ci-monitor-event>` message: the PR, failed checks, new review comments, merge conflict | `session.append` (tool output is skipped, because event-shaped text there is data) |
| Rounds, noise, halts | The JSON printed by `review-state.js ingest` | `tool.call` |
| Threads | The JSON printed by `review-state.js check`, `reply` and `wait`, and the `continue` subcommand | `tool.call` |
| Wake settled | The main turn ending | `turn.complete` |

### Contract with the skill

The skill owns what its script prints, in [OUTPUT-CONTRACT.md](../../token-effort/skills/shepherding-pr-reviews/OUTPUT-CONTRACT.md). Doomwheel reads the fields listed there, as the skill prints them. [mods/doomwheel/tests/fixtures.ts](mods/doomwheel/tests/fixtures.ts) holds that output, and [mods/doomwheel/tests/contract.test.ts](mods/doomwheel/tests/contract.test.ts) fails if a field it reads is renamed. If the contract changes, update the fixture first, then `mods/doomwheel/model.ts`. The script's name, `review-state.js`, is written once, as `SKILL_SCRIPT` in `model.ts`.

### Files

| File | Role |
|---|---|
| `mods/doomwheel/register.tsx` | The hooks, the dispatch of events into state, and the Pane drawing |
| `mods/doomwheel/model.ts` | Pure logic: the signal parsers, the reducer that folds events into wheel state, the visibility gate, and labels |
| `mods/doomwheel/sprites.ts` | The Doomwheel, baked into self-animating SVG (SMIL) for every phase, heat and fatigue |
| `mods/doomwheel/tests/` | The skill's contract fixture, and unit and Pane tests on the terminal and desktop surfaces |

### Known limits

- **State starts when Doomwheel first sees a signal.** A PR raised before the plugin was installed shows up on its next `ingest`, `check`, `wait` or `continue`, with counts taken from the script's output.
- **A `reply`** names only a thread, so it is logged against the most recently active wheel shown.
- **The skill's Stop hook block** is not visible to mods. Open threads show from the latest `check`.
- Supported on Windows and Linux; macOS is untested.

## 🧪 Develop

[run_checks.sh](../../../../run_checks.sh) validates the plugin and runs its tests (see [docs/running-checks.md](../../../../docs/running-checks.md)). After editing, run `/reload-plugins` in a session. The plugin sets no `version`, so each commit is a new version (see the [README](../../../../README.md)).
