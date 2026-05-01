## Scenario
The skill successfully files the issue with `gh issue create`.

## Expected Behavior
The skill reports the URL of the newly filed issue to the user in the form "Done. Issue filed: <url>".

## Pass Criteria
- [ ] Reported the issue URL after `gh issue create` completed
- [ ] Message includes the URL returned by the `gh` command
