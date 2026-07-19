# 🪙 Token Effort

> Low-stakes intelligence for high-latency humans

A collection of OpenCode skills and agents that do just enough to avoid being replaced by a shell script.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=HeadlessTarry_Token-Effort&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=HeadlessTarry_Token-Effort)

## 📋 Prerequisites

- [gh CLI](https://cli.github.com/) — authenticated with `gh auth login`
- [jq](https://jqlang.github.io/jq/download/) — JSON parsing
- [git](https://git-scm.com/) — version control (for vendor repo cloning)

## ⤵️ Installation

```bash
git clone https://github.com/HeadlessTarry/Token-Effort.git
cd Token-Effort
```

**PowerShell (Windows):**
```powershell
.\install.ps1
```

**Bash (Linux/macOS/WSL):**
```bash
./install.sh
```

Both scripts install Token-Effort's own skills and agents, plus any third-party vendor dependencies declared in `vendor.json`. Restart OpenCode to pick up changes.

**Options:**

| Flag (PS) | Flag (Bash) | Description |
|-----------|-------------|-------------|
| `-Skill <name>` | `--skill <name>` | Install only the specified skill |
| `-Agent <name>` | `--agent <name>` | Install only the specified agent |
| `-Local` | `--local` | Install to `.opencode/` in the project directory instead |
| `-Update` | `--update` | Pull latest for each vendor repo |

## 📦 What Gets Installed

**Token-Effort's own content:**
- `skills/` → OpenCode skill definitions
- `agents/` → OpenCode agent definitions

**Vendor dependencies** (declared in `vendor.json`):
- **Plugins** — cloned to `.vendor/<name>/` and registered in `opencode.json` (with your confirmation)
- **Skills** — cloned to `.vendor/<name>/` and cherry-picked skills copied to OpenCode's skills directory

The install is idempotent — safe to re-run. Re-running with `--update` / `-Update` pulls the latest from vendor repos.

## 🔌 Vendor Dependencies

Third-party dependencies are declared in `vendor.json` at the repo root. Vendors are cloned into `.vendor/` (gitignored) during install.

**Plugin example** (registered in `opencode.json`):
```json
{
  "name": "superpowers",
  "repo": "https://github.com/obra/superpowers.git",
  "opencode_plugin_spec": "superpowers@git+https://github.com/obra/superpowers.git"
}
```

**Skill example** (cherry-picked to OpenCode's skills directory):
```json
{
  "name": "addyosmani-agent-skills",
  "repo": "https://github.com/addyosmani/agent-skills.git",
  "extract_skills": ["debugging-and-error-recovery", "doubt-driven-development"]
}
```

To add a new vendor, add an entry to `vendor.json` and re-run the install script.

## 🛡️ Safety

- `opencode.json` is backed up before any modification (timestamped `.bak` file)
- Existing plugin entries are never removed — only new ones are appended
- Invalid JSON in an existing config aborts the install (no corruption)
- Vendor failures prompt for retry/skip/abort

## 🗂️ Directory Structure

```
skills/          → OpenCode skill definitions
agents/          → OpenCode agent definitions
lib/             → Install helper scripts (vendor + config management)
vendor.json      → Declarative vendor manifest
.vendor/         → Gitignored: cloned vendor repos
```

## 🔄 Workflows

### 🧩 Feature Development & Bug Fix Workflow

```mermaid
graph LR
    A1["/propose-feature"]
    A2["/report-bug"]
    DONE["✅ Done"]

    subgraph COL1["📋 New"]
        direction TB
        TRIAGE["/triaging-gh-issue"]
    end

    subgraph COL2["🧠 Brainstorming"]
        direction TB
        BRAIN["/brainstorming-gh-issue"]
        SPEC(["📄 Design Spec"])
    end

    subgraph COL3["🏗️ Building"]
        direction TB
        BUILD["/building-gh-issue + agents"]
        PR(["📄 Pull Request + Decision Record(s)"])
    end

    A1 --> TRIAGE
    A2 --> TRIAGE
    TRIAGE --> BRAIN
    BRAIN -.-> SPEC
    BRAIN --> BUILD
    BUILD -.-> PR
    BUILD --> DONE
```

Issue states (📋 New, 🧠 Brainstorming, 🏗️ Building, ✅ Done) correspond to GitHub Project board columns. Each skill automatically advances the issue from an earlier status.
