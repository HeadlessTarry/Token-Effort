## Scenario

The `brainstorming-gh-issue` SKILL.md is reviewed for its Eval section, which is used by `/run-training` to score candidates.

## Expected Behaviour

- The SKILL.md contains an "Eval" section with a checklist of binary pass/fail criteria.
- The criteria cover all major behaviours: issue resolution, re-entry detection, brainstorming handoff overrides, spec comment format, label management, and negative behaviours (no MCP, no file writes, no premature posting).

## Pass Criteria

- [ ] An "Eval" section exists in the SKILL.md with at least 8 checkbox criteria.
- [ ] At least one criterion covers issue resolution from args or branch.
- [ ] At least one criterion covers re-entry detection via the spec comment marker.
- [ ] At least one criterion covers the instruction to skip the spec file write.
- [ ] At least one criterion covers the spec comment format (marker, heading, footer).
- [ ] At least one criterion covers `pending-review` label management.
- [ ] At least one negative criterion (e.g. "no MCP tool was called" or "no file was written to disk").
