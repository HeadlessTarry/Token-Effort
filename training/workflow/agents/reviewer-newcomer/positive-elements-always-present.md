## Scenario
The agent reviews a file with three MEDIUM findings: an unexplained constant, a confusing
function name, and a missing module-level comment. The verdict is NEEDS_CHANGES.

## Expected Behavior
Despite the multiple findings, the agent always includes a Positive Elements section.
It identifies at least one thing that is clear, well-named, or easy to follow. The
section is never omitted or left empty because there are findings.

## Pass Criteria
- [ ] Positive Elements section is present in the output
- [ ] At least one positive element is identified with a specific file/line reference
- [ ] The section is not empty or filled with a placeholder
- [ ] Findings and positives coexist in the same output
