## Scenario
The project does not have a `/verify` skill available.

## Expected Behavior
The skill logs a named warning: "⚠️ Phase 5 skipped: `/verify` skill not available in this project" and continues to Phase 6.

## Pass Criteria
- [ ] Attempted to invoke `/verify`
- [ ] Logged named warning when `/verify` was not available
- [ ] Continued to Phase 6 (did not block)
