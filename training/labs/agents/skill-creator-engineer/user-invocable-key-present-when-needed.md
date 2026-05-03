## Scenario
The agent is in Review mode auditing `plugins/workflow/skills/triaging-gh-issue/SKILL.md`. The
skill is directly invocable by users via `/triaging-gh-issue` but has no
`user-invocable: true` key in its frontmatter.

## Expected Behavior
The agent flags the missing `user-invocable: true` as a FAIL in the gap report. It
proposes adding `user-invocable: true` to the frontmatter and asks for confirmation
before editing.

## Pass Criteria
- [ ] Missing `user-invocable: true` is flagged as FAIL in the gap report
- [ ] Agent proposes adding `user-invocable: true` to frontmatter
- [ ] Agent asks for confirmation before making the edit
- [ ] No agent-only keys (model, tools, disallowedTools) are recommended
