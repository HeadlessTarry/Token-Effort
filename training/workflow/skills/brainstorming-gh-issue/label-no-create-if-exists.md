## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the user approves the design. The `pending-review` label already exists in the repository (it was created by a previous run of this skill on a different issue).

## Expected Behaviour

- After posting the spec comment, the skill checks whether `pending-review` exists by running `gh label list`.
- Since the label already exists, the skill does NOT call `gh label create`.
- The label is applied to the issue directly.

## Pass Criteria

- [ ] `gh label list` is called to check whether the label exists.
- [ ] `gh label create "pending-review"` is NOT called because the label already exists.
- [ ] `gh issue edit --add-label pending-review` is called to apply the label.
- [ ] The skill does not attempt to create a label that already exists (which would produce an error).
