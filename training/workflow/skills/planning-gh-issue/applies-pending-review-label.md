## Scenario

The user runs `/token-effort:planning-gh-issue 60`. After plan approval, Phase 4 posts the comment and applies labels. The `pending-review` label already exists on the repository.

## Expected Behaviour

- Phase 4 calls `gh label list` to check whether `pending-review` exists.
- Since `pending-review` already exists, `gh label create` is NOT called.
- `gh issue edit 60 --add-label "pending-review"` is called after the comment is posted.
- The skill reports completion referencing the issue number.

## Pass Criteria

- [ ] `gh label list` is called before applying the label.
- [ ] `gh label create "pending-review"` is NOT called (label already exists).
- [ ] `gh issue edit 60 --add-label "pending-review"` is called.
- [ ] The label is applied AFTER the plan comment is posted (not before).
- [ ] A completion message references issue #60.
