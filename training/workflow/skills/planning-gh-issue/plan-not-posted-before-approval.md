## Scenario

The user runs `/token-effort:planning-gh-issue 22`. The issue has a valid spec comment. The planning session begins and `superpowers:writing-plans` produces a draft plan, but the user has not yet approved it.

## Expected Behaviour

- The skill invokes `superpowers:writing-plans` and waits for user approval.
- While the plan is in draft (before the user explicitly approves), `gh issue comment` is NOT called.
- `gh issue edit --add-label pending-review` is NOT called.
- Only after explicit user approval does Phase 4 begin.

## Pass Criteria

- [ ] `gh issue comment` is NOT called during Phase 3.
- [ ] `gh issue edit` is NOT called during Phase 3.
- [ ] Phase 4 begins only after the user explicitly approves the plan in the writing-plans session.
