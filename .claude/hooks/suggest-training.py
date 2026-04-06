#!/usr/bin/env python3
"""
PostToolUse hook: suggest running /run-training when a skill or agent definition is edited.

Reads the hook payload from stdin, checks if the modified file is a skill or agent
definition, and prints a suggestion to stdout if so. Claude sees this output and
will prompt the user to run training interactively.

Matches paths from both the source repo (plugins/token-effort/skills/*/SKILL.md) and the
installed location (~/.claude/skills/*/SKILL.md).
"""

import json
import re
import sys


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    file_path = payload.get("tool_input", {}).get("file_path", "")
    if not file_path:
        sys.exit(0)

    # Normalise separators so patterns work on Windows paths too
    normalised = file_path.replace("\\", "/")

    skill_match = re.search(r"skills/([^/]+)/SKILL\.md$", normalised)
    agent_match = re.search(r"agents/([^/]+)\.md$", normalised)

    if skill_match:
        kind = "skill"
        name = skill_match.group(1)
    elif agent_match:
        kind = "agent"
        name = agent_match.group(1)
    else:
        sys.exit(0)

    article = "An" if kind == "agent" else "A"
    print(json.dumps({
        "decision": "block",
        "reason": f"""
        {article} {kind} definition was just edited: {name}.
        You MUST now prompt the user to ask if they wish to proceed with training the {kind}.
        If the user approves training, invoke the Skill tool now with skill='run-training' args='{name}'.
        Once training is complete, or if the user declined training, then resume the original plan.
        """
    }))


if __name__ == "__main__":
    main()
