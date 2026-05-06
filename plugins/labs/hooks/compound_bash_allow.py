"""
compound-bash-allow: PreToolUse hook that auto-approves chained Bash commands
when every sub-command is individually covered by an allow rule.
"""

import fnmatch
import json
import sys
from pathlib import Path


def parse_command(command: str) -> list[str]:
    """Split a shell command on &&, ||, |, ; respecting quote boundaries."""
    parts = []
    current = []
    i = 0
    quote_char = None

    while i < len(command):
        ch = command[i]

        if quote_char:
            current.append(ch)
            if ch == quote_char:
                quote_char = None
            i += 1
            continue

        if ch in ('"', "'"):
            quote_char = ch
            current.append(ch)
            i += 1
            continue

        # Check two-character operators first
        two = command[i:i + 2]
        if two in ("&&", "||"):
            parts.append("".join(current).strip())
            current = []
            i += 2
            continue

        if ch in ("|", ";"):
            parts.append("".join(current).strip())
            current = []
            i += 1
            continue

        current.append(ch)
        i += 1

    parts.append("".join(current).strip())
    return [p for p in parts if p]


def load_settings(path: Path) -> tuple[list[str], list[str]]:
    """Return (allow_patterns, deny_patterns) from a settings.json file."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        perms = data.get("permissions", {})
        return perms.get("allow", []), perms.get("deny", [])
    except Exception:
        return [], []


def extract_bash_patterns(entries: list[str]) -> list[str]:
    """Extract inner glob from Bash(...) entries."""
    patterns = []
    for entry in entries:
        if entry.startswith("Bash(") and entry.endswith(")"):
            patterns.append(entry[5:-1])
    return patterns


def is_allowed(sub_cmd: str, allow_patterns: list[str], deny_patterns: list[str]) -> bool:
    for pat in deny_patterns:
        if fnmatch.fnmatch(sub_cmd, pat):
            return False
    for pat in allow_patterns:
        if fnmatch.fnmatch(sub_cmd, pat):
            return True
    return False


def main() -> None:
    try:
        payload = json.loads(sys.stdin.read())
        tool_input = payload.get("tool_input", {})
        command = tool_input.get("command", "")

        if not command:
            return

        sub_commands = parse_command(command)
        if not sub_commands:
            return

        # Load global settings
        global_allow_raw, global_deny_raw = load_settings(
            Path.home() / ".claude" / "settings.json"
        )

        # Load project settings (cwd is the project root when the hook runs)
        project_allow_raw, project_deny_raw = load_settings(
            Path(".claude") / "settings.json"
        )

        allow_patterns = extract_bash_patterns(global_allow_raw + project_allow_raw)
        deny_patterns = extract_bash_patterns(global_deny_raw + project_deny_raw)

        for sub_cmd in sub_commands:
            if not is_allowed(sub_cmd, allow_patterns, deny_patterns):
                return  # Fall through — let Claude Code handle it

        print(json.dumps({"decision": "approve"}))

    except Exception:
        pass  # Never block; always fall through on error


if __name__ == "__main__":
    main()
