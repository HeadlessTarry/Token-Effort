## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the user approves the design. The `pending-review` label does not yet exist in the repository — it has never been created.

## Expected Behaviour

- After posting the spec comment, the skill checks whether `pending-review` exists by running `gh label list`.
- Since the label is absent, the skill creates it with `gh label create "pending-review"` before attempting to apply it.
- The label is then applied to the issue.

## Pass Criteria

- [ ] `gh label list` is called before attempting to apply `pending-review`.
- [ ] `gh label create "pending-review"` is called because the label was not found.
- [ ] `gh issue edit --add-label pending-review` is called after the label is created.
- [ ] The skill does not error out because the label was missing.
