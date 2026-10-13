"""Fail when an overhaul mod does not validate, or its tests fail.

Each mod folder under `overhaul-mods/` gets `claude plugin validate --strict`.
A mod whose `hooks/hooks.json` names a hooks module under `modules` also gets
`claude plugin test`. The `claude` CLI is the repo-local copy pinned in
`package.json`, so local runs and CI use the same version.
"""

import json
import shutil
import subprocess
import sys
from pathlib import Path

MODS_DIR = "overhaul-mods"
BIN_DIR = Path("node_modules") / ".bin"


def mod_dirs(paths: list[str]) -> list[Path]:
    mods = {Path(*Path(path).parts[:2]) for path in paths if Path(path).parts[0] == MODS_DIR}
    return sorted(mod for mod in mods if mod.is_dir())


def has_hooks_module(mod: Path) -> bool:
    try:
        with open(mod / "hooks" / "hooks.json", encoding="utf-8") as handle:
            config = json.load(handle)
    except (OSError, ValueError):
        return False
    return isinstance(config, dict) and bool(config.get("modules"))


def main(paths: list[str]) -> int:
    claude = shutil.which("claude", path=str(BIN_DIR))
    if claude is None:
        print(f"{BIN_DIR / 'claude'} not found; run ./setup_dev_env.sh to install it")
        return 1
    failed = False
    for mod in mod_dirs(paths):
        commands = [["plugin", "validate", "--strict", str(mod)]]
        if has_hooks_module(mod):
            commands.append(["plugin", "test", str(mod)])
        for command in commands:
            if subprocess.run([claude, *command]).returncode != 0:
                print(f"{mod}: `claude {' '.join(command)}` failed")
                failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
