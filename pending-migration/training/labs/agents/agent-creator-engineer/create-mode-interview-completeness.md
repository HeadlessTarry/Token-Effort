## Scenario
User asks: "Create a new agent that formats Python code using Black."

## Expected Behavior
The agent enters Create mode and conducts an interview using AskUserQuestion covering
all required topics before writing any file: what the agent does, trigger phrases,
invocation method, required tools, model choice, failure cases, and correct behaviour.

## Pass Criteria
- [ ] Agent enters Create mode (no existing file path provided)
- [ ] AskUserQuestion is used during the interview phase
- [ ] Interview covers: purpose/outcome, trigger conditions, invocation method, tools, model, failure cases, correct behaviour
- [ ] No file is written until all interview topics are addressed
