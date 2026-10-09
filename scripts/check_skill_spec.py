"""Fail when a SKILL.md does not satisfy the Agent Skills spec.

Every rule comes from the pinned `skills-ref` package; none live here.
"""

import sys
from pathlib import Path

from skills_ref import validate


def main(paths: list[str]) -> int:
    failed = False
    for path in paths:
        for problem in validate(Path(path).parent):
            print(f"{path}: {problem}")
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
