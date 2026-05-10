## Scenario

The user runs `/brainstorming-gh-issue 28 29`. Two issue numbers are present in the arguments.

## Expected Behaviour

- The skill detects multiple candidates: `28` and `29`.
- Before fetching any issue, it asks the user which single issue to proceed with.
- The skill waits for the user's response before continuing.
- After the user selects one (e.g. `28`), it proceeds with that issue only.

## Pass Criteria

- [ ] The skill asks the user to choose between the two issue numbers before fetching either issue.
- [ ] `gh issue view` is NOT called before the user responds.
- [ ] After the user selects one issue number, only that issue is fetched and brainstormed.
- [ ] Brainstorming is initiated for exactly one issue.
