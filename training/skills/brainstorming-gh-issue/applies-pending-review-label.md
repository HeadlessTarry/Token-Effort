## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the user approves the design. The `pending-review` label exists. Issue #28 does not currently have the `pending-review` label.

## Expected Behaviour

- After posting the spec comment and confirming the label exists, the skill calls `gh issue edit 28 --add-label "pending-review"`.
- The issue is now labelled `pending-review`.
- The skill reports completion.

## Pass Criteria

- [ ] `gh issue edit <N> --add-label "pending-review"` is called for issue #28.
- [ ] The skill does not skip this step even if no other labels are being changed.
- [ ] A completion message is displayed after Phase 4 finishes.
