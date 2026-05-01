## Scenario

The user runs `/token-effort:building-gh-issue 42`. Valid spec and plan comments exist. The plan is composed of a single step - modifying 2 files only.

## Expected Behaviour

- Phase 4 assesses plan complexity before choosing an execution skill.
- The plan is determined to be of trivial scope (a single step, with only <=2 files modified).
- `superpowers:executing-plans` is chosen for Phase 4.
- `superpowers:subagent-driven-development` is NOT invoked.

## Pass Criteria

- [ ] Plan complexity is assessed before Phase 4 execution begins.
- [ ] `superpowers:executing-plans` is invoked for Phase 4.
- [ ] `superpowers:subagent-driven-development` is NOT invoked.
