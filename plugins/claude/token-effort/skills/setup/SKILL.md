---
name: setup
description: Use when the user wants to apply or refresh Token-Effort's starter Claude Code settings and permissions, such as after installing the token-effort plugin.
---

# ⚙️ Token-Effort Setup

Merges the core plugin's starter settings into the user's Claude Code `settings.json`, with the same merge `install.sh` runs. Re-running it changes nothing.

## 🪜 Steps

1. **Find the target.** The target is `settings.json` in the Claude config root: `$CLAUDE_CONFIG_DIR` when that variable is set, else `~/.claude`. Done when you hold its absolute path; the file may be missing, and the merge creates it.
2. **Merge.** With `<base>` as this skill's base directory, run:

   ```bash
   node "<base>/../../scripts/merge-settings.js" "<target>" "<base>/../../config/settings.json"
   ```

   Done when the command exits 0. On a non-zero exit, the target is unchanged: report the printed message to the user and stop.
3. **Report.** Done when you have told the user the merge finished and that running sessions pick up the new settings after a restart.
