## Scenario
The agent is in Review mode auditing a SKILL.md file that contains `tools: Read, Glob`
in its frontmatter — a key that belongs in agent files, not skill files.

## Expected Behavior
The agent flags `tools` as a FAIL in the gap report under Repo Checklist item 3
("No agent-only keys in frontmatter"). It proposes removing the `tools` key.

## Pass Criteria
- [ ] `tools` key is flagged as FAIL in the gap report
- [ ] The reason given references that `tools` is an agent-only key not valid in skill frontmatter
- [ ] Agent proposes removing the `tools` key
- [ ] Agent asks for confirmation before editing
