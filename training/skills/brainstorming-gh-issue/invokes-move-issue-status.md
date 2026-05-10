## Scenario

The user runs `/brainstorming-gh-issue 28`. The issue has no `pending-review` label. After fetching the issue, Phase 2c begins.

## Expected Behaviour

- The skill invokes `move-issue-status` with status "Brainstorming" to pull the issue into the correct project board column.
- This happens regardless of whether the issue is a fresh brainstorm or a re-entry.
- If the status move fails, the skill logs a warning and continues — it does NOT block the brainstorming session.
- The status move happens BEFORE Phase 4 (handoff to brainstorming).

## Pass Criteria

- [ ] `move-issue-status` is invoked with status "Brainstorming" in Phase 3.
- [ ] The invocation happens before Phase 4 begins.
- [ ] The skill treats the status move as non-fatal — a failure produces a warning but does not stop execution.
- [ ] The status move is attempted on every invocation, including re-entry mode.
