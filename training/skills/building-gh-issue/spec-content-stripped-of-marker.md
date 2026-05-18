## Scenario
Issue #42 has a comment starting with `<!-- brainstorming-gh-issue:spec -->` followed by spec content.

## Expected Behavior
The skill extracts the spec content with the marker line stripped and uses it as context for Phase 4.

## Pass Criteria
- [ ] Found comment starting with `<!-- brainstorming-gh-issue:spec -->`
- [ ] Stripped the marker line from the spec content
- [ ] Used remaining spec content as context (not the raw comment with marker)
