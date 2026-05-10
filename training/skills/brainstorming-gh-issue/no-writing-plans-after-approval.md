## Scenario

The user runs `/brainstorming-gh-issue 28`. The brainstorming session completes and the user approves the design spec.

## Expected Behaviour

- The skill proceeds directly to Phase 5 (post spec comment + apply label).
- The skill does NOT invoke `writing-plans` or any other implementation/planning skill after approval.
- The explicit gate section between Phase 4 and Phase 5 is present in the skill definition.

## Pass Criteria

- [ ] `writing-plans` is NOT invoked after the user approves the spec
- [ ] Phase 5 executes immediately after approval (post spec comment, apply label)
- [ ] The skill contains an explicit gate section instructing to stop and not invoke `writing-plans`
