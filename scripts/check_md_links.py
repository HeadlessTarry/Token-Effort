"""Fail when a Markdown file links to a relative path that does not exist (offline)."""

import re
import sys
from pathlib import Path

LINK = re.compile(r"!?\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
EXTERNAL = re.compile(r"^[a-z][a-z0-9+.-]*:", re.IGNORECASE)


def broken_links(path: Path) -> list[tuple[int, str]]:
    broken = []
    in_fence = False
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if line.lstrip().startswith(("```", "~~~")):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        for target in LINK.findall(line):
            if EXTERNAL.match(target) or target.startswith("#"):
                continue
            file_part = target.split("#", 1)[0]
            if not (path.parent / file_part).exists():
                broken.append((number, target))
    return broken


def main(paths: list[str]) -> int:
    failed = False
    for name in paths:
        for number, target in broken_links(Path(name)):
            print(f"{name}:{number}: broken link {target}")
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
