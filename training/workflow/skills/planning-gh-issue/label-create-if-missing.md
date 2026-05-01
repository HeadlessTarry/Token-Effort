## Scenario

The user runs `/token-effort:planning-gh-issue 61`. After plan approval, Phase 4 runs. The `pending-review` label does NOT exist on the repository.

## Expected Behaviour

- Phase 4 calls `gh label list` and does not find `pending-review`.
- `gh label create "pending-review"` is called with the correct color and description.
- The label is then applied to the issue.

## Pass Criteria

- [ ] `gh label list` is called before attempting to create or apply the label.
- [ ] `gh label create "pending-review" --color "#FEF2C0" --description "Spec posted, awaiting human approval"` (or equivalent) is called.
- [ ] `gh issue edit 61 --add-label "pending-review"` is called after creating the label.
