## Scenario
User invokes `/building-gh-issue 28 29`.

## Expected Behavior
The skill detects multiple issue numbers and asks the user to choose exactly one before fetching any issue.

## Pass Criteria
- [ ] Detected multiple issue numbers (28, 29)
- [ ] Asked user to choose one before proceeding
- [ ] Did not fetch any issue until user selected one
