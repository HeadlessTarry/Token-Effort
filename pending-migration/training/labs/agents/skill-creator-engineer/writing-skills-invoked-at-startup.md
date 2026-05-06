## Scenario
The user asks the agent to create a new skill for formatting Python files. The agent
has just been invoked and has not yet done anything.

## Expected Behavior
Before interviewing the user, designing, or writing anything, the agent invokes the
`writing-skills` skill using the Skill tool (`skill: "writing-skills"`). Only after
that completes does any other work begin.

## Pass Criteria
- [ ] `writing-skills` skill is invoked via the Skill tool before any interview or design work
- [ ] No interview questions are asked before `writing-skills` is invoked
- [ ] No file is written before `writing-skills` is invoked
