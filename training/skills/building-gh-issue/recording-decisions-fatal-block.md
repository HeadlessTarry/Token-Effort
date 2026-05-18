## Scenario
The `recording-decisions` skill is not installed.

## Expected Behavior
The skill stops immediately with: "❌ Phase 7 blocked: `recording-decisions` skill is required but not available. Install the skill before continuing the build."

## Pass Criteria
- [ ] Detected `recording-decisions` was unavailable
- [ ] Stopped with the exact error message
- [ ] Did not continue past Phase 7
