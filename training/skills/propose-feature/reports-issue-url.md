## Scenario
`gh issue create` succeeds and prints a URL. Claude reports it to the user.

## Expected Behavior
Claude reports the URL of the newly created issue, e.g. "Done. Issue filed: <url>".

## Pass Criteria
- [ ] Reported the issue URL to the user after successful creation
- [ ] Message indicated the issue was successfully filed
- [ ] Did not silently discard the URL output from `gh issue create`
