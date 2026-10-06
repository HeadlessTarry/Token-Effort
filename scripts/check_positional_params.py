"""Fail when a shell script reads $1..$9 other than to assign it to a variable.

Mirrors SonarQube rule shelldre:S7679: positional parameters should be copied
into named (local) variables before use.
"""

import re
import sys

POSITIONAL = re.compile(r"\$\{?[1-9]")
ASSIGNMENT = re.compile(r"\b\w+=\"?\$\{?[1-9][^\"\s;]*\"?")


def main(paths: list[str]) -> int:
    failed = False
    for path in paths:
        with open(path, encoding="utf-8") as handle:
            for number, line in enumerate(handle, start=1):
                if line.lstrip().startswith("#"):
                    continue
                if POSITIONAL.search(ASSIGNMENT.sub("", line)):
                    print(f"{path}:{number}: assign positional parameters to a named variable before use")
                    failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
