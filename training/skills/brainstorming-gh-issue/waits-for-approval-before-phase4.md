## Scenario

The user runs `/brainstorming-gh-issue 28`. The brainstorming session produces a design. The user has not yet explicitly approved it — they are still reviewing the final section.

## Expected Behaviour

- Phase 4 (posting the spec comment, applying the label) does NOT run until the user has approved the design within the brainstorming session.
- The skill waits for explicit approval before posting anything to GitHub.

## Pass Criteria

- [ ] `gh issue comment` is NOT called until after the user has approved the design in the brainstorming session.
- [ ] `gh issue edit --add-label pending-review` is NOT called until after the user has approved.
- [ ] The handoff instructions to brainstorming make clear that Phase 4 runs only after user design approval.
