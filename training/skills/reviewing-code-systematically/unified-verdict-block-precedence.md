## Scenario
Three reviewers return: `reviewer-dead-code` → NEEDS_CHANGES, `reviewer-docs` → BLOCK,
`reviewer-newcomer` → PASS.

## Expected Behavior
The unified verdict is BLOCK because at least one reviewer returned BLOCK.
The Reviewer Verdicts table shows each individual verdict accurately.

## Pass Criteria
- [ ] UNIFIED VERDICT is BLOCK
- [ ] Reviewer Verdicts table shows NEEDS_CHANGES for reviewer-dead-code
- [ ] Reviewer Verdicts table shows BLOCK for reviewer-docs
- [ ] Reviewer Verdicts table shows PASS for reviewer-newcomer
