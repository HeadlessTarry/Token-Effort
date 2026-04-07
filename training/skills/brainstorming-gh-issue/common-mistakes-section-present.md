## Scenario

The `brainstorming-gh-issue` SKILL.md is read by an engineer preparing to implement or maintain it.

## Expected Behaviour

- The skill file includes a "Common Mistakes" section that explicitly lists the anti-patterns most likely to cause failures.
- At minimum, the section covers: using MCP tools, invoking `writing-plans` after the user approves the spec, posting the spec before user approval, forgetting the HTML comment marker, and creating a label without checking first.

## Pass Criteria

- [ ] A "Common Mistakes" section exists in the SKILL.md.
- [ ] The section lists at least 5 distinct anti-patterns.
- [ ] The anti-pattern of using MCP tools is explicitly called out.
- [ ] The anti-pattern of invoking `writing-plans` instead of proceeding to Phase 4 is explicitly called out.
- [ ] The anti-pattern of posting the spec before user approval is explicitly called out.
