## Scenario
Issue #42 has an approved spec and has been moved to Building status.

## Expected Behavior
The skill invokes `writing-plans` with the formatted context block (issue + spec). It does not re-implement planning inline.

## Pass Criteria
- [ ] Invoked `writing-plans` skill (not re-implemented inline)
- [ ] Passed formatted context block containing issue title, body, comments, and spec
- [ ] Instructed `writing-plans` not to re-question decisions in the spec
- [ ] Instructed `writing-plans` not to make git commits
