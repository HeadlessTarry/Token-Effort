# 📊 Status Line

A custom Python statusline for Claude Code that gives at-a-glance visibility into replay token load, rate limit consumption, and tool error presence.

## 🖥️ What It Shows

```
🟢 42K  │  5h ▓▓▓▓▓▓▓░░░ 72% → 14:32  │  7d ▓▓▓░░░░░░░ 28% → Mon 09:00
```

The line has up to four sections separated by `│`:

### 🔄 Replay Token Load (R)

Shows the replay cost of the current context — the tokens Claude must re-read on every turn:

```
R = input_tokens + cache_creation_input_tokens + cache_read_input_tokens
```

| Value     | Indicator | Meaning                          |
|-----------|-----------|----------------------------------|
| < 200K    | 🟢        | Healthy                          |
| 200K–499K | 🟡        | Consider `/compact` after task   |
| ≥ 500K    | 🔴        | Run `/compact` now               |

Shows `🟢 --` before the first API response in a session.

### ⏱️ 5-Hour Rate Limit Bar

Usage against your Claude.ai 5-hour rolling window, with reset time.

### 📅 7-Day Rate Limit Bar

Usage against your Claude.ai weekly window, with reset day and time.

**Bar colour thresholds (both windows):**

| Usage  | Bar colour | Indicator |
|--------|------------|-----------|
| < 50%  | Green      |           |
| < 80%  | Yellow     |           |
| ≥ 80%  | Red        | 🚨        |

Rate limit sections are omitted when `rate_limits` data is unavailable (non-Pro accounts, or before the first API response).

### ⚠️ Tool Error Indicator

Appears when any `tool_result` error larger than 2 KB exists in the current session transcript. Shows the size of the largest such error (e.g. `⚠ err 8KB`).

## 🚀 Installation

From the repository root:

```bash
bash statusline/install.sh
```

Then restart Claude Code. The statusline appears at the bottom of the interface after the first assistant response.

### What `install.sh` does

1. Copies `statusline/statusline.py` to `~/.claude/statusline.py`
2. Adds (or updates) the `statusLine` entry in `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "python ~/.claude/statusline.py"
  }
}
```

Any other existing settings are preserved.

## 🧪 Testing

Test the script directly with mock input:

```bash
echo '{"session_id":"test","transcript_path":"/tmp/none.jsonl","context_window":{"current_usage":{"input_tokens":50000,"cache_creation_input_tokens":100000,"cache_read_input_tokens":20000}},"rate_limits":{"five_hour":{"used_percentage":72.0,"resets_at":1714000000},"seven_day":{"used_percentage":28.0,"resets_at":1714100000}}}' | python statusline/statusline.py
```

## 🙏 Attribution

Based on the reference implementation by [mtberlin2023](https://github.com/mtberlin2023/claude-code-skills/blob/main/statusline/statusline.sh). This version re-implements the core indicators in Python with a different visual style and drops the session expiry forecasting.
