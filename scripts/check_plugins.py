"""Fail when the marketplace, the core plugin or an overhaul mod does not validate.

1. The repo root is the core plugin's source, so it must hold none of the
   default-named plugin components in `ROOT_COMPONENTS`; they would change what
   the core plugin loads.
2. `claude plugin validate` runs on the marketplace (which covers the core
   plugin's entry), on each skills directory the core plugin lists, and on each
   folder under `plugins/claude/overhaul-mods/`. Errors fail, and so do
   warnings, except `ALLOWED_WARNINGS`: plugins carry no `version` so that
   they track commits.
3. A mod whose `hooks/hooks.json` names a hooks module under `modules` also
   gets `claude plugin test`.

The `claude` CLI is the repo-local copy pinned in `package.json`, so local runs
and CI use the same version.
"""

import json
import shutil
import subprocess
import sys
from pathlib import Path

MARKETPLACE = Path(".claude-plugin") / "marketplace.json"
CORE_PLUGIN = "token-effort"
MODS_DIR = Path("plugins") / "claude" / "overhaul-mods"
BIN_DIR = Path("node_modules") / ".bin"
CLI = "claude"
ROOT_COMPONENTS = [
    Path(".claude-plugin") / "plugin.json",
    Path("hooks"),
    Path("agents"),
    Path("commands"),
    Path("bin"),
    Path("output-styles"),
    Path("settings.json"),
    Path(".mcp.json"),
    Path(".lsp.json"),
]
ALLOWED_WARNINGS = ["No version specified."]


def root_components() -> list[Path]:
    return [path for path in ROOT_COMPONENTS if path.exists()]


def core_skill_dirs() -> list[Path]:
    with open(MARKETPLACE, encoding="utf-8") as handle:
        marketplace = json.load(handle)
    for entry in marketplace.get("plugins", []):
        if entry.get("name") == CORE_PLUGIN:
            return [Path(skills) for skills in entry.get("skills", [])]
    return []


def has_hooks_module(mod: Path) -> bool:
    try:
        with open(mod / "hooks" / "hooks.json", encoding="utf-8") as handle:
            config = json.load(handle)
    except (OSError, ValueError):
        return False
    return isinstance(config, dict) and bool(config.get("modules"))


def allowed(warning: dict) -> bool:
    message = warning.get("message", "")
    return any(message.startswith(prefix) for prefix in ALLOWED_WARNINGS)


def problems(report: dict) -> list[str]:
    found = []
    for section in [report.get("manifest") or {}, *report.get("contents", [])]:
        found += [f"error: {issue.get('path')}: {issue.get('message')}" for issue in section.get("errors", [])]
        found += [
            f"warning: {issue.get('path')}: {issue.get('message')}"
            for issue in section.get("warnings", [])
            if not allowed(issue)
        ]
    return found


def validate(claude: str, target: Path) -> bool:
    result = subprocess.run(
        [claude, "plugin", "validate", "--json", str(target)],
        capture_output=True,
        encoding="utf-8",
    )
    try:
        report = json.loads(result.stdout)
    except ValueError:
        print(f"{target}: `{CLI} plugin validate` printed no report\n{result.stdout}{result.stderr}")
        return False
    found = problems(report)
    if result.returncode != 0 and not found:
        found = [f"exit {result.returncode}: {result.stderr.strip()}"]
    for problem in found:
        print(f"{target}: {problem}")
    return not found


def main() -> int:
    sys.stdout.reconfigure(line_buffering=True)  # keep our lines in order with the CLI's output
    failed = False
    for path in root_components():
        print(f"{path}: the repo root is the core plugin's source; move this out of the root")
        failed = True
    claude = shutil.which(CLI, path=str(BIN_DIR))
    if claude is None:
        print(f"{BIN_DIR / CLI} not found; run ./setup_dev_env.sh to install it")
        return 1
    mods = sorted(path for path in MODS_DIR.iterdir() if path.is_dir())
    for target in [Path("."), *core_skill_dirs(), *mods]:
        if not validate(claude, target):
            failed = True
    for mod in mods:
        if has_hooks_module(mod) and subprocess.run([claude, "plugin", "test", str(mod)]).returncode != 0:
            print(f"{mod}: `{CLI} plugin test {mod}` failed")
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
