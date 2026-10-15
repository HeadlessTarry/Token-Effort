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
| Doomwheel | A side pane showing each PR's review process, read from the session and GitHub, as a Skaven Doomwheel (below) |

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

A pane that shows each PR's review process as a Skaven Doomwheel: a wooden wheel with a rat running inside, powered by a warpstone crystal. It reads the session and GitHub, and needs no skill: any PR review process drives it.

### Which PRs get a wheel

- A PR this session created with `gh pr create`.
- A PR this session armed Auto-Fix on.
- A PR named in a `<ci-monitor-event>`.
- A PR added by hand with `/doomwheel <url>` (or `/doomwheel owner/name#N`). `/doomwheel` alone opens the pane.

Wheels are kept per session. A wheel that is not retired resumes polling when the session starts again.

### What it shows

| Gauge | Meaning | Look |
|---|---|---|
| **HEAT** | Unresolved review threads + failing checks + 1 for a merge conflict | The crystal glows green at 0, rising to red at 5 or more (a cosmetic threshold) |
| **LAPS** | Submitted reviews, from any reviewer, with no cap | From lap 7 the wheel slows and the rat sweats. Cosmetic only: nothing halts |
| **THREADS** | `unresolved/total` review threads | Red while any are unresolved, green at 0 |

| Phase | When | Wheel |
|---|---|---|
| 📜 Offering laid | PR tracked, Auto-Fix not armed | Still |
| ⚙ Spinning | Auto-Fix on | Turning, with warp-lightning |
| ⚡ Warp-bolt! | A `<ci-monitor-event>` arrived; settles when the turn ends | Racing, lightning strikes |
| 💥 Cracked | Auto-Fix cut while the PR is open with work left (unresolved threads, failing checks or a conflict) | Cracked and smoking, the rat knocked out |
| ❄ Cold | Auto-Fix off, no open work | The rat sleeps |
| 🏆 Victory | PR merged | The rat stands on the still wheel holding the warpstone aloft, in a gold blaze |
| 🪦 Scrapped | PR closed unmerged | The wheel lies in a grey heap and the rat slinks away |

A cracked wheel goes back to Spinning when Auto-Fix is re-armed, or to Cold once its open work drops to zero. Victory and Scrapped are retired: polling stops, and **Clear retired** removes them.

| Event | Toast | Native notification | Pane opens |
|---|---|---|---|
| Wheel first appears | — | — | ✓ |
| Auto-Fix armed | ✓ | — | — |
| Cracked | ✓ | ✓ | ✓ |
| Victory | ✓ | — | ✓ |
| Scrapped | — | — | — |

- **Pane:** one card per PR, newest first, with the wheel, the HEAT, LAPS and THREADS gauges and a **squeak-scroll** of the PR's last events.
- **Squeak-scroll:** PR raised, Auto-Fix armed or cut, wakes, each submitted review (author and state), unresolved threads rising or falling, checks turning red or recovering, a merge conflict appearing or clearing, the wheel cracking, Victory and Scrapped. A poll that changes nothing writes nothing.

On the desktop app the wheel is an animated SVG. In a terminal it is drawn as a single glyph.

### What it reads

Session signals find the PRs and make the wheel react at once. GitHub polling supplies the true numbers.

| Signal | Source | Read with |
|---|---|---|
| PR raised | A `gh pr create` Bash or PowerShell call whose output holds the PR URL | `tool.call` |
| Auto-Fix on / off | The desktop app's `set_monitor` call (`auto_fix`, `url`) and its answer | `tool.call` |
| Wake | A `<ci-monitor-event>` message | `session.append` (tool output is skipped, because event-shaped text there is data) |
| Wake settled | The main turn ending | `turn.complete` |
| PR state, reviews, threads, checks, mergeability | One `gh api graphql` query per PR | `$.process.run` |

Each live PR is polled every 60 seconds, and at once on a wake, on a `gh` call that names the PR, before a cut of its Auto-Fix and at the end of each turn. If `gh` is missing or not signed in, the wheel runs on session signals alone, with one dim line on its card saying so.

### Files

| File | Role |
|---|---|
| `mods/doomwheel/register.tsx` | The hooks, the polling, the dispatch of events into state, and the Pane drawing |
| `mods/doomwheel/model.ts` | Pure logic: the signal parsers, the poll query and its reader, the reducer that folds events into wheel state, and labels |
| `mods/doomwheel/sprites.ts` | The Doomwheel, baked into self-animating SVG (SMIL) for every phase, heat and lap count |
| `mods/doomwheel/tests/` | Unit tests, and Pane tests on the terminal and desktop surfaces with `gh` and the clock mocked |

### Known limits

- **The first 100** reviews, review threads and checks of a PR are read; past that the gauges undercount.
- **Checks** are the latest commit's check runs and commit statuses.
- **A `gh` call names a PR** by its URL, `owner/name#N` or its number standing alone, so a call that merely mentions the number also triggers a poll.
- Supported on Windows and Linux; macOS is untested.

## 🧪 Develop

[run_checks.sh](../../../../run_checks.sh) validates the plugin and runs its tests (see [docs/running-checks.md](../../../../docs/running-checks.md)). After editing, run `/reload-plugins` in a session. The plugin sets no `version`, so each commit is a new version (see the [README](../../../../README.md)).
