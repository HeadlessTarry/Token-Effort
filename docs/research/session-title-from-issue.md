# 🔬 Session title from a referenced GitHub issue

Research date: 2026-10-14. Local Claude Code CLI: `2.1.300` (`claude --version`). Latest CHANGELOG heading at time of reading: `2.1.299` (https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md, fetched raw).

Goal: when a session starts with a prompt such as `/triage #123` or `/implement #456`, set the session title to `[#<issue>] <short summary>` (summary at most 8 words), in both the CLI and the desktop app Code tab.

## 📌 Summary

- The CLI has a supported, deterministic hook for this: `UserPromptSubmit` hooks may return `hookSpecificOutput.sessionTitle`. Verified locally with a throwaway hook (see "Local experiments").
- `UserPromptSubmit` fires for slash-command and skill prompts too, and receives the raw text (`/token-effort:report-bug #123`). Verified locally.
- The model has no built-in tool to rename the session in the CLI. In the desktop app it has the MCP tool `mcp__ccd_session_mgmt__set_session_title`.
- Recommendation: a `UserPromptSubmit` hook shipped in the token-effort plugin, which takes the issue title from `gh` and truncates it to 8 words. Add an optional desktop-only step for an agent-written summary later, if the hook title is not good enough in practice. Details in "Recommendation".

## 🧰 Supported ways to set a title

| Mechanism | Who triggers it | Source |
| :- | :- | :- |
| `-n, --name <name>` CLI flag | User at launch | `claude --help` (local): "Set a display name for this session (shown in the prompt box, /resume picker, and terminal title)". Added in 2.1.76 (CHANGELOG). |
| `/rename [name]` | User. Without a name it generates one from the conversation history | https://code.claude.com/docs/en/commands (`/rename` row); https://code.claude.com/docs/en/sessions#name-your-sessions |
| Session picker `Ctrl+R` | User | https://code.claude.com/docs/en/sessions#use-the-session-picker |
| `SessionStart` hook `hookSpecificOutput.sessionTitle` | Hook. Applies when `source` is `startup`, `resume` or `fork`. The docs say it has "the same effect as `/rename`" | https://code.claude.com/docs/en/hooks (SessionStart decision control); added in 2.1.152 (CHANGELOG) |
| `UserPromptSubmit` hook `hookSpecificOutput.sessionTitle` | Hook. The docs say: "Sets the session title. Use to name sessions automatically based on the prompt content" | https://code.claude.com/docs/en/hooks#userpromptsubmit; added in 2.1.94 (CHANGELOG: "Added `hookSpecificOutput.sessionTitle` to `UserPromptSubmit` hooks for setting the session title") |
| Agent SDK `renameSession()` | SDK host | Named in the hooks docs' `session_title` input field description (https://code.claude.com/docs/en/hooks) |
| Plan accept | Automatic. Renames unless the user already named the session | https://code.claude.com/docs/en/sessions#name-your-sessions |
| Desktop app or claude.ai rename | User, or the agent in desktop (see below). Syncs to the CLI from 2.1.221 | https://code.claude.com/docs/en/sessions#name-your-sessions; CHANGELOG 2.1.221 |

There is no settings key that sets the title. The `UserPromptExpansion` event, which fires for typed slash commands, documents only `decision`, `reason` and `additionalContext`. It does not list `sessionTitle` (https://code.claude.com/docs/en/hooks, UserPromptExpansion section).

The model has no CLI tool to rename the session. The tools reference lists no rename or title tool (https://code.claude.com/docs/en/tools-reference, searched for "title" and "rename"). Built-in commands such as `/rename` are run by the user, not by the `Skill` tool. That second point is an assumption: I found no doc stating that the model can invoke `/rename`.

## 🏷️ How the default title is generated

- If a session has no name, Claude Code generates "a short summary of your first prompt, written by a background request to the small/fast model". A `claude -p` run started from a shell gets no generated title (https://code.claude.com/docs/en/sessions#name-your-sessions).
- Since 2.1.234, generated titles are short names such as "Login button bug" (CHANGELOG 2.1.234).
- `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=1` turns off terminal title updates. It also "skips the background small/fast-model request that generates a session title" (https://code.claude.com/docs/en/env-vars).
- In transcripts, the generated title is stored as `{"type":"ai-title",...}` and a custom title as `{"type":"custom-title","customTitle":...}`. Observed in `C:\Users\Tarry\.claude\projects\c--Users-Tarry-Dev-HeadlessTarry-Token-Effort\*.jsonl`. The docs call this format internal and say it may change (https://code.claude.com/docs/en/sessions#where-transcripts-are-stored), so do not write these entries by hand.
- The CLI shows the session name in the terminal title. `--name` is "shown in ... terminal title" (`claude --help`). Assumption: a hook `sessionTitle` updates the terminal title the same way, since the docs equate it with `/rename`. Not observed in a terminal.

## 🪝 Can a hook detect `#123` and set the title?

Yes, in the CLI. Input and output come from https://code.claude.com/docs/en/hooks#userpromptsubmit:

- Input `prompt`: "the submitted text".
- Input `session_title`: present when the session already has a custom title. The docs say a hook "can check this field first to avoid overwriting an existing custom title".
- Output `hookSpecificOutput.sessionTitle`, plus optional `additionalContext`.
- `UserPromptSubmit` has no matcher and fires on every prompt, so the hook must filter itself.

A hook cannot write the agent's own summary: it runs before the model sees the prompt. It can still build a deterministic title by running `gh issue view <n> --json title`, which works locally (`gh` 2.88.1; `gh issue view 227 --json number,title` returned `[#227] Add the shepherding-pr-reviews skill`). To get a model-written 8-word summary from a hook, the hook would have to call a model itself, for example `claude -p --model haiku`. That adds latency and cost. A nested `claude` also loads the same hooks, so it would need a recursion guard (assumption, inferred from the fact that settings and plugin hooks load for `-p` runs).

Plugin caveat: a plugin's SessionStart `sessionTitle` is ignored if the plugin finishes installing after SessionStart hooks have run (https://code.claude.com/docs/en/hooks). The docs state no such limit for `UserPromptSubmit`.

### 🧪 Local experiments

These used a throwaway `--settings` file and a Python hook in the session scratchpad, logging stdin and emitting `sessionTitle`. User settings were not changed.

1. `claude -p --settings settings.json "/token-effort:report-bug #123"`, with `UserPromptExpansion` set to block:
   - Hooks fired in order `SessionStart` → `UserPromptSubmit` → `UserPromptExpansion`.
   - `UserPromptSubmit.prompt` was the raw `"/token-effort:report-bug #123"`.
   - `UserPromptExpansion` received `command_name: "token-effort:report-bug"` and `command_args: "#123"`.
   - No title was written, because the prompt was blocked.
2. `claude -p ... --model haiku "Reply with the single word OK. (ref #123)"`: the transcript gained `{"type":"custom-title","customTitle":"[#123] Test title from hook",...}`. So `sessionTitle` from `UserPromptSubmit` applies, even in a `-p` run.
3. `claude -p --resume <same id> ...`: both `SessionStart` (`source: "resume"`) and `UserPromptSubmit` received `session_title: "[#123] Test title from hook"`. So the "already titled" guard works.

The test transcripts remain under `C:\Users\Tarry\.claude\projects\C--Users-Tarry-AppData-Local-Temp-claude-...-scratchpad-hooktest\`.

## 🖥️ Desktop app (Code tab)

- Desktop "runs the same underlying engine" and reads the same settings. **Hooks** and skills defined in settings apply to both (https://code.claude.com/docs/en/desktop, "Coming from the CLI?" and "Shared configuration"). A local Code tab session runs its own bundled copy of Claude Code, which may be a different version from the terminal `claude` (same page, "Claude Code version in the Code tab").
- The user can rename by clicking the session title. Claude can also be asked to rename a session (https://code.claude.com/docs/en/desktop).
- `mcp__ccd_session_mgmt__set_session_title` is a desktop-app MCP tool, exposed to the agent in this environment as a deferred tool. The schema I loaded this session has parameters `session_id` (a sessionId or `"self"`) and `title`, plus an app-set `_consent`. Its description says:
  - Use it "after a session's scope has clearly changed and the old title is misleading".
  - App-generated titles are replaced without asking.
  - A title the user set needs approval, except in bypass mode. Unattended sessions decline.
  - "A subagent can't rename the session it runs in."

  It does not exist in the terminal CLI.
- Desktop titles are written to the transcript as `custom-title` entries even when the app generated them. This session's transcript holds `customTitle: "Claude session title from GitHub issues"`, a title nobody typed. **Assumption:** a desktop session's `session_title` hook input may therefore be non-empty after the app titles it. A guard of the form "skip if `session_title` is set" could then skip in desktop. This matters little on the first prompt, if the hook runs before the app's title request, but that ordering is not verified.
- **Unverified:** whether the desktop sidebar shows a title set by a `UserPromptSubmit` hook, or overwrites it with its own generated title. The CHANGELOG fixed this sync for VS Code ("Fixed the editor tab keeping an old name after a session was renamed with /rename, by a SessionStart hook, or on claude.ai", 2.1.285), and the CLI picks up desktop renames (2.1.221). I found no entry for the reverse, CLI hook to desktop sidebar. This needs a manual test in the Code tab.

## ⚖️ Candidate designs

| Design | Works in CLI | Works in desktop | Deterministic | Summary quality | Cost and risk |
| :- | :- | :- | :- | :- | :- |
| (a) Instruction in user `AGENTS.md`/`CLAUDE.md`: "after reading the issue, rename the session" | No. The agent has no rename tool in the CLI | Yes, via `set_session_title("self", ...)` | No. The model may forget, and subagents cannot rename | Best: written by the agent after understanding the issue | Uses always-loaded context on every session. Fires an approval prompt if the user already named the session |
| (b) Step inside `/triage` and `/implement` | No (same reason) | Yes | Better than (a), since it is scoped to the skill | Best | Both skills are third-party (`mattpocock-skills`, `C:\Users\Tarry\.claude\plugins\cache\mattpocock\mattpocock-skills\1.3.1\skills\engineering\{triage,implement}\SKILL.md`), so this needs a fork or an upstream change |
| (c1) `UserPromptSubmit` hook using the `gh` title, truncated to 8 words | Yes, verified | Probably. Hooks apply, but sidebar display is unverified | Yes | Good. Issue titles are usually short and human-written. Truncation can cut mid-phrase | One `gh` call (network) on the first prompt that has `#n`. Needs `gh` auth. Fail-open if `gh` fails |
| (c2) Hook as c1, but summarised by `claude -p --model haiku` when the title is over 8 words | Yes | Same as c1 | Mostly | Good | Adds seconds of latency before the first turn, plus extra tokens. Needs a recursion guard |
| (d) c1 plus (a) or (b) for desktop refinement | Yes | Yes | Hook part yes | Best in desktop | The most moving parts. The desktop agent rename may need approval, because the hook's title counts as user-set (assumption) |

Hook filtering rules, which apply to every hook variant:

- Act only when `session_title` is absent.
- Act only when the prompt matches a leading command plus an issue ref, for example `^/\S+\s+#(\d+)\b`, or any `#\d+`, to taste.
- Emit nothing on failure.
- Emit UTF-8 JSON.

## ✅ Recommendation

Adopt **(c1)**: a `UserPromptSubmit` hook. Implemented as `config/hooks/session-title.mjs`, registered in `config/settings.json` and copied to `~/.claude/hooks/` by `install.sh`. It lives in core config, not an overhaul mod, because it is unrelated to any theme. Steps:

1. Skip if `session_title` is present.
2. Match `#(\d+)` in a prompt that starts with `/`.
3. Run `gh issue view <n> --json title`.
4. Emit `{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","sessionTitle":"[#<n>] <first 8 words of title>"}}`.

Reasons:

- It is the only option that works in the CLI.
- It is verified end to end locally.
- It uses no model tokens.
- It needs no change to third-party skills.

The "agent-generated" summary is not reachable in the CLI except by calling a model from inside the hook (c2). A human-written issue title, truncated, is a close and cheaper substitute. Upgrade to c2 only if long titles prove common.

For the desktop app, first test manually whether the hook's title shows in the Code tab sidebar. Add design (b)/(d), an agent call to `set_session_title("self", ...)`, only if it does not.

