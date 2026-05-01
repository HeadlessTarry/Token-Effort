## Scenario
After parallel dispatch, `reviewer-dead-code` returns one HIGH finding and one MEDIUM
finding. `reviewer-newcomer` returns one MEDIUM finding. `reviewer-docs` returns PASS
with no findings.

## Expected Behavior
The unified report groups all findings by severity: the HIGH finding appears first under
"## HIGH Findings", the two MEDIUM findings follow under "## MEDIUM Findings". Each
finding heading is prefixed with the source reviewer name in brackets. `reviewer-docs`
output appears in Additional Reviewer Output.

## Pass Criteria
- [ ] HIGH finding appears under a "## HIGH Findings" section
- [ ] Both MEDIUM findings appear under a "## MEDIUM Findings" section
- [ ] Each finding heading is prefixed with the reviewer name in brackets (e.g. `[reviewer-dead-code]`)
- [ ] `reviewer-docs` PASS output appears in Additional Reviewer Output, not in severity sections
