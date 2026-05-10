## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the user approves the design. Phase 4 runs.

## Expected Behaviour

- Phase 4 executes its steps in the correct order:
  1. Post the spec as a comment (`gh issue comment`).
  2. Ensure the `pending-review` label exists (`gh label list`, then `gh label create` if needed).
  3. Apply the `pending-review` label (`gh issue edit --add-label`).
- The spec comment is always posted before the label is applied.

## Pass Criteria

- [ ] `gh issue comment` is called before `gh issue edit --add-label`.
- [ ] `gh label list` is called before `gh label create` (if the label is missing).
- [ ] `gh label create` (if called) happens before `gh issue edit --add-label`.
