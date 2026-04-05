## Scenario

The user runs `/brainstorming-gh-issue 33`. Issue #33 has two labels: `enhancement` and `good first issue`. The `pending-review` label is not present.

## Expected Behaviour

- The skill fetches the issue and checks labels.
- It finds `enhancement` and `good first issue` but not `pending-review`.
- It treats this as a fresh brainstorm — no re-entry logic is triggered.
- Brainstorming is initiated with the issue context.

## Pass Criteria

- [ ] The skill checks for `pending-review` specifically, not just whether any labels are present.
- [ ] Since `pending-review` is absent, the skill proceeds as a fresh brainstorm.
- [ ] No mention of a prior spec or re-entry mode is made.
- [ ] Brainstorming is initiated with issue #33's context.
