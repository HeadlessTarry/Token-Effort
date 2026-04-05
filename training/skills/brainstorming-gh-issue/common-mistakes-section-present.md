## Scenario

The `brainstorming-gh-issue` SKILL.md is read by an engineer preparing to implement or maintain it.

## Expected Behaviour

- The skill file includes a "Common Mistakes" section that explicitly lists the anti-patterns most likely to cause failures.
- At minimum, the section covers: using MCP tools, writing the spec file to disk, posting the spec before user approval, forgetting the HTML comment marker, creating a label without checking first, and using shell expansion syntax.

## Pass Criteria

- [ ] A "Common Mistakes" section exists in the SKILL.md.
- [ ] The section lists at least 5 distinct anti-patterns.
- [ ] The anti-pattern of using MCP tools is explicitly called out.
- [ ] The anti-pattern of writing the spec file to disk is explicitly called out.
- [ ] The anti-pattern of posting the spec before user approval is explicitly called out.
