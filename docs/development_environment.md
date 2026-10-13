# 💻 Development Environment

## ⚙️ Pre-Requisites

The following must be installed, and available on your CLI `PATH`:

- [Git](https://git-scm.com/) and Bash (Git Bash on Windows)
- [UV (latest)](https://docs.astral.sh/uv/), which runs [pre-commit](https://pre-commit.com/) via `uvx`; no project virtual environment is needed
- [Node.js](https://nodejs.org/) with npm, which installs the `claude` CLI version pinned in [package.json](../package.json)

## 🚀 Initial Setup

```bash
# cd <repo root or worktree>
./setup_dev_env.sh --skip-checks
```

This runs `npm ci`, which installs the pinned `claude` CLI into `node_modules/.bin/` for the overhaul mod checks, and installs the [pre-commit](https://pre-commit.com/) `pre-commit` and `commit-msg` git hooks. CI runs the same script before [run_checks.sh](../run_checks.sh). Drop `--skip-checks` to also run [run_checks.sh](../run_checks.sh) straight away.

Git hooks live in the shared `.git/hooks` directory, so one run per clone covers every worktree of that clone. `node_modules/` is per worktree, so run the script again in each new worktree. Without them, commits skip the branch guard and the commit message check (CI does not run these two).

## ✏️ Making Changes

Run [run_checks.sh](../run_checks.sh) at any time to check your changes. See [🏃 Running Checks](running-checks.md) for what it runs.

## 🩺 Troubleshooting

**Every file shows CRLF warnings or shellcheck reports `SC1017` (literal carriage return):** the clone was checked out before `.gitattributes` forced LF line endings. With no uncommitted changes, re-checkout the files:

```bash
git ls-files -z | xargs -0 rm -f && git checkout -- .
```

**`git commit` fails with `don't commit to branch`:** you are on `main`. Commit from a worktree on a new branch.
