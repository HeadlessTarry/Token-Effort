## Scenario
<!-- Covers: SKILL.md "Step 3 — Auto-triage GitHub Actions workflow" prerequisite block -->
The user selects "3". The skill prints the Step 3 prerequisite message and asks if
everything is configured.

## Expected Behavior
The prerequisite message and the follow-up skip message must reference
`docs/github-setup.md` as a Markdown link pointing to
`https://github.com/HeadlessTarry/Token-Effort/` — not as a bare local path or
backtick-quoted filename. The specific version tag in the URL may vary across
releases and is not checked.

## Pass Criteria
- [ ] The prerequisite message contains a Markdown link whose URL starts with `https://github.com/HeadlessTarry/Token-Effort/`
- [ ] The prerequisite message does NOT present `docs/github-setup.md` as a bare backtick-quoted local path
- [ ] The follow-up skip message (printed when the user says no/skip) also uses a GitHub URL link, not a bare path
