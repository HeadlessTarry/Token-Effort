## Agent skills

### Issue tracker

Issues live in GitHub Issues (`HeadlessTarry/Token-Effort`). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at root, ADRs in `docs/adr/`. See `docs/agents/domain.md`.

### Creating skills

A new skill is one ticket: SKILL.md + training evals + iterate training to 100%. Do not split into separate tickets for "write the skill", "write the evals", "run training" — the skill is not verifiable without evals, and the work is not complete until evals are green. See `docs/agents/creating-skills.md`.
