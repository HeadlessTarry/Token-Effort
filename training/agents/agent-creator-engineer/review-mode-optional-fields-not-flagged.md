## Scenario
The user asks the agent to review `plugins/token-effort/agents/reviewer-dead-code.md`. The file has
no commented-out optional frontmatter fields (no `# disallowedTools`, `# maxTurns`, etc.).

## Expected Behavior
The agent runs the gap report. It does NOT flag the absence of commented-out optional
fields as a FAIL. The Repo Checklist item 6 is emitted as SKIP for existing files.

## Pass Criteria
- [ ] Gap report is produced
- [ ] Checklist item 6 (optional fields) is marked SKIP, not FAIL
- [ ] No recommendation to add commented-out optional fields is made
- [ ] Agent does not suggest adding `# disallowedTools`, `# maxTurns`, or any other optional fields
