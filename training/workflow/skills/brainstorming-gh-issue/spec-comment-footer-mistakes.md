## Scenario

The user runs `/brainstorming-gh-issue 28`. Brainstorming completes and the spec is posted as a GitHub comment.

## Expected Behaviour

- The spec comment's footer includes a disclaimer that the spec is AI-generated.
- The footer contains the phrase "Mistakes do happen" (or semantically equivalent wording) to set expectations for the reviewer.

## Pass Criteria

- [ ] The spec comment footer contains the exact text "Mistakes do happen" (matching the capitalisation in the spec template).
- [ ] The footer indicates the spec is AI-generated.
- [ ] The footer appears after the main design content, separated by a horizontal rule (`---`).
