## Scenario
No template is found. The user invokes `/propose-feature` and waits for the first question.

## Expected Behavior
Claude's very first question focuses on the problem/motivation, not the solution.

## Pass Criteria
- [ ] First question asked is about the problem or motivation (e.g., "What problem are you trying to solve?")
- [ ] First question is NOT about the proposed solution, use cases, or title
- [ ] Only one question is asked at a time (not all questions at once)
