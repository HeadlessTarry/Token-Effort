## Agent skills

### Issue tracker

Issues live in GitHub Issues (`HeadlessTarry/Token-Effort`). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `GLOSSARY.md` at root, ADRs in `docs/adr/`. See `docs/agents/domain.md`.

### Changing skills

All changes to skill files use mattpocock's `writing-for-agents` skill.

### Local development

**Before making changes:** create a worktree, then run `./setup_dev_env.sh`. See `docs/development_environment.md` when setting up or troubleshooting local dev.

**Before committing:** run `./run_checks.sh` and fix all failures. See `docs/running-checks.md` for what each check validates.
