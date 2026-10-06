"""Fail when a shell script does not open with the standard header.

The first line must be `#!/usr/bin/env bash` and the first statement must be
`set -euo pipefail`. Comment lines and blank lines may sit between the two.
"""

import sys
from pathlib import Path

SHEBANG = "#!/usr/bin/env bash"
SET_LINE = "set -euo pipefail"


def check(lines: list[str]) -> str | None:
    if not lines or lines[0].rstrip() != SHEBANG:
        return f"first line must be `{SHEBANG}`"
    for line in lines[1:]:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped == SET_LINE:
            return None
        return f"first statement must be `{SET_LINE}`, found `{stripped}`"
    return f"first statement must be `{SET_LINE}`, found none"


def main(paths: list[str]) -> int:
    root = Path.cwd().resolve()
    failed = False
    for path in paths:
        resolved = (root / path).resolve()
        if not resolved.is_relative_to(root):
            print(f"{path}: outside the repository, skipped")
            continue
        try:
            with open(resolved, encoding="utf-8") as handle:
                reason = check(handle.read().splitlines())
        except UnicodeDecodeError:
            reason = "not valid UTF-8"
        if reason:
            print(f"{path}: {reason}")
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
