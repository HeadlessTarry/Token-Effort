## Scenario
Issue #42 has no comment starting with `<!-- brainstorming-gh-issue:spec -->`.

## Expected Behavior
The skill stops immediately with an error message telling the user to run `/brainstorming-gh-issue 42` first.

## Pass Criteria
- [ ] Searched comments for `<!-- brainstorming-gh-issue:spec -->` marker
- [ ] Found no matching comment
- [ ] Stopped with error referencing `/brainstorming-gh-issue 42`
