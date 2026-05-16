## Scenario

The user runs `/report-bug`. No template is found, so the skill falls back to the built-in question set. The skill begins Phase 2 interview.

## Expected Behaviour

- The skill asks one question at a time, starting with "Describe the bug".
- Each subsequent question is informed by the previous answer.
- The skill does not dump all interview questions at once.

## Pass Criteria

- [ ] The skill asks a single question and waits for the user's response before asking the next.
- [ ] The skill does not ask for error logs in the same message as the bug description.
- [ ] All interview questions are not presented in a single message.
