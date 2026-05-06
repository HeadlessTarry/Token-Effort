## Scenario
The user asks: "Create a skill that runs database migrations." The request gives no
further detail.

## Expected Behavior
The agent enters Create mode and interviews the user to answer all five required
questions before advancing to Phase 2: what the skill does, trigger phrases, whether
it is user-invocable or background-only, known failure cases, and correct behaviour.

## Pass Criteria
- [ ] Agent enters Create mode (no existing SKILL.md named or provided)
- [ ] AskUserQuestion is used during the interview phase
- [ ] All five interview topics are covered: outcome, trigger phrases, user-invocable vs background, failure cases, correct behaviour
- [ ] No design or file creation happens until all five are answered
