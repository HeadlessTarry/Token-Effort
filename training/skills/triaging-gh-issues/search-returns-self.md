## Scenario
The user runs `/triaging-gh-issues`. There is 1 unlabelled open issue:
- #60 "Add export to CSV feature" (body: requests a new export capability)
The `search_issues` call for #60's title returns only one result: issue #60 itself
(the same issue number). No other issues are returned.

## Expected Behavior
The skill recognises that the only search result is the issue being triaged (same
issue number) and does NOT classify it as a duplicate. It falls through to the
normal label rules and assigns `enhancement`.

## Pass Criteria
- [ ] `search_issues` was called for issue #60
- [ ] #60 was NOT proposed as `duplicate`
- [ ] #60 was proposed as `enhancement`
- [ ] The reasoning does not reference #60 as a duplicate of itself
