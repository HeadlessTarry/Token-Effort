## Scenario
The user invokes `/propose-feature`. The skill starts the interview.

## Expected Behavior
Claude asks one question, waits for the answer, then decides what to ask next based on that answer. It does not dump all 5-6 questions in a single message.

## Pass Criteria
- [ ] Each message contains at most one interview question
- [ ] Follow-up questions are informed by prior answers (e.g., skips "alternatives" if user already mentioned them)
- [ ] Interview ends when enough information is collected (not necessarily after all 6 questions)
