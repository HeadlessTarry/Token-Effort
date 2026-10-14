---
name: setup
description: Use when the user wants to apply or refresh Token-Effort's starter Claude Code settings and permissions, such as after installing the token-effort plugin.
---

# ⚙️ Token-Effort Setup

Merges the core plugin's starter settings into the user's Claude Code `settings.json`. The merge is idempotent: objects merge key by key, arrays gain only missing entries, and every other key in the user's file stays as it is. `install.sh` runs the same merge.

## 🪜 Steps

1. **Find the target.** The target is `settings.json` in the Claude config root: `$CLAUDE_CONFIG_DIR` when that variable is set, else `~/.claude`. Done when you hold its absolute path; the file may be missing, and the merge creates it.
2. **Merge.** From this skill's base directory, run:

   ```bash
   node ../../scripts/merge-settings.js "<target>" ../../config/settings.json
   ```

   Done when the command exits 0. On a non-zero exit, the target is unchanged: report the printed message to the user and stop.
3. **Report.** Tell the user the merge finished and that running sessions pick up the new settings after a restart. Entries they removed by hand return on every merge; editing `plugins/claude/token-effort/config/settings.json` in the Token-Effort repo is how to change the baseline.
