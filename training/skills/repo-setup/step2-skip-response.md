## Scenario
The user selects "2". When asked "Have you installed the superpowers plugin (or do you
already have it)? [yes/no/skip]", the user replies "skip".

## Expected Behavior
"skip" is treated the same as "no" — the skill notes superpowers is not installed in the
summary, does not block, and completes cleanly.

## Pass Criteria
- [ ] Treated "skip" as equivalent to "no" for the superpowers question
- [ ] Noted "not installed (recommended)" or equivalent in the completion summary
- [ ] Did NOT block or halt after "skip"
- [ ] Skill completed cleanly
