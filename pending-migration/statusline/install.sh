#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing Claude Code statusline..."

# 1. Copy script
cp "$SCRIPT_DIR/statusline.py" ~/.claude/statusline.py
echo "  Copied statusline.py → ~/.claude/statusline.py"

# 2. Patch settings.json using Python inline (no jq dependency)
python - <<'EOF'
import json, pathlib, sys

settings_path = pathlib.Path.home() / ".claude" / "settings.json"
settings_path.parent.mkdir(parents=True, exist_ok=True)

data = {}
if settings_path.exists():
    try:
        with open(settings_path) as f:
            data = json.load(f)
    except json.JSONDecodeError:
        print(f"  Warning: {settings_path} contained invalid JSON — creating fresh file", file=sys.stderr)

data["statusLine"] = {"type": "command", "command": "python ~/.claude/statusline.py"}

with open(settings_path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")

print(f"  Updated {settings_path}")
EOF

echo "Done. Restart Claude Code for the statusline to appear."
