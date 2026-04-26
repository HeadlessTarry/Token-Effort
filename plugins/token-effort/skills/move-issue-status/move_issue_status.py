"""Move a GitHub issue to a named project board status column.

Outputs a single JSON line to stdout. Exit code is always 0.
"""
import json
import os
import subprocess
import sys


def resolve_repo() -> tuple[str, str]:
    if os.environ.get("GITHUB_ACTIONS"):
        repo = os.environ.get("GITHUB_REPOSITORY", "")
        if not repo:
            raise ValueError("GITHUB_REPOSITORY is not set")
        owner, name = repo.split("/", 1)
        return owner, name

    result = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        capture_output=True, text=True, encoding="utf-8",
    )
    url = result.stdout.strip()
    if url.startswith("https://"):
        parts = url.rstrip("/").removesuffix(".git").split("/")
        return parts[-2], parts[-1]
    # Expected SSH form: git@github.com:owner/repo.git
    try:
        repo_part = url.split(":", 1)[1].removesuffix(".git")
        owner, name = repo_part.split("/", 1)
    except (IndexError, ValueError) as exc:
        raise ValueError(f"Cannot parse remote URL: {url!r}") from exc
    return owner, name


def find_project_item(owner: str, issue_number: int) -> list[dict]:
    result = subprocess.run(
        ["gh", "project", "list", "--owner", owner, "--format", "json", "--limit", "100"],  # practical cap; raise if >100 projects
        capture_output=True, text=True, encoding="utf-8",
    )
    data = json.loads(result.stdout)

    matches: list[dict] = []
    for project in data.get("projects", []):
        pnum = project["number"]
        items_result = subprocess.run(
            ["gh", "project", "item-list", str(pnum),
             "--owner", owner, "--format", "json", "--limit", "1000"],  # boards with >1000 items may miss matches
            capture_output=True, text=True, encoding="utf-8",
        )
        items_data = json.loads(items_result.stdout)
        for item in items_data.get("items", []):
            if item.get("content", {}).get("number") == issue_number:
                matches.append({
                    "item_id": item["id"],
                    "project_number": pnum,
                    "project_id": project["id"],
                    "project_name": project["title"],
                    "current_status": item.get("status"),
                })
    return matches


def get_status_field(owner: str, project_number: int) -> dict | None:
    result = subprocess.run(
        ["gh", "project", "field-list", str(project_number),
         "--owner", owner, "--format", "json"],
        capture_output=True, text=True, encoding="utf-8",
    )
    data = json.loads(result.stdout)
    for field in data.get("fields", []):
        if field["name"] == "Status" and field["type"] == "ProjectV2SingleSelectField":
            return {"field_id": field["id"], "options": field["options"]}
    return None


def run(issue_number: int, target_status: str | None) -> dict:
    owner, _repo = resolve_repo()  # gh project commands use owner only
    matches = find_project_item(owner, issue_number)

    if target_status is None:
        if len(matches) != 1:
            return {"status": "skipped"}
        match = matches[0]
        field = get_status_field(owner, match["project_number"])
        if not field:
            return {"status": "skipped"}
        current = match["current_status"]
        if not current:
            return {"status": "skipped"}
        options = field["options"]
        names = [o["name"] for o in options]
        try:
            idx = names.index(current)
        except ValueError:
            return {"status": "skipped"}
        if idx != 0:  # not in first column
            return {"status": "skipped"}
        if idx >= len(options) - 1:  # no next column exists
            return {"status": "skipped"}
        target_option = options[idx + 1]
    else:
        if not matches:
            return {"status": "error", "message": f"Issue #{issue_number} is not on any GitHub project board."}
        match = matches[0]  # when an explicit status is provided, use the first matching project
        field = get_status_field(owner, match["project_number"])
        if not field:
            return {"status": "error", "message": f"No Status field found in project '{match['project_name']}'."}
        target_lower = target_status.lower()
        target_option = next(
            (o for o in field["options"]
             if o["name"].lower() == target_lower or target_lower in o["name"].lower()),
            None,
        )
        if target_option is None:
            available = ", ".join(f"'{o['name']}'" for o in field["options"])
            return {"status": "error", "message": f"Status '{target_status}' not found. Available: {available}"}

    subprocess.run(
        ["gh", "project", "item-edit",
         "--project-id", match["project_id"],
         "--id", match["item_id"],
         "--field-id", field["field_id"],
         "--single-select-option-id", target_option["id"]],
        capture_output=True, text=True, encoding="utf-8",
    )
    return {"status": "moved", "issue": issue_number, "to": target_option["name"], "project": match["project_name"]}


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "Usage: move_issue_status.py <issue-number> [<status>]"}))
        return
    issue_arg = sys.argv[1].lstrip("#")
    try:
        issue_number = int(issue_arg)
    except ValueError:
        print(json.dumps({"status": "error", "message": f"Invalid issue number: {issue_arg}"}))
        return
    target_status = sys.argv[2] if len(sys.argv) > 2 else None
    try:
        result = run(issue_number, target_status)
    except Exception as exc:
        result = {"status": "error", "message": str(exc)}
    print(json.dumps(result))


if __name__ == "__main__":
    main()
