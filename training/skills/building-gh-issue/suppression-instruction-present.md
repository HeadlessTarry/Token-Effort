## Scenario
The skill invokes `subagent-driven-development` in Phase 4.

## Expected Behavior
The invocation prompt includes the suppression instruction: "Do not invoke `finishing-a-development-branch` — this will be handled by the calling skill after all review steps complete."

## Pass Criteria
- [ ] Suppression instruction present verbatim in the execution skill prompt
- [ ] Instruction was not paraphrased or omitted
