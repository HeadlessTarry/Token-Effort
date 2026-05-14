## Scenario
The script exits with code 1, indicating base branch detection failed
(e.g. no matching upstream, ambiguous remotes).

## Expected Behavior
The skill asks the user to specify the base branch manually, e.g.:
"I could not detect the base branch. Please specify the branch to diff against
(e.g. `origin/main`)."

## Pass Criteria
- [ ] Exit code 1 is recognised as "base branch not detected"
- [ ] User is asked to specify the base branch manually
- [ ] The example format `origin/main` or equivalent is provided
- [ ] No further processing is attempted
