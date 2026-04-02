## Scenario
The user runs `/triaging-gh-issues`. There is 1 unlabelled open issue:
- #20 "Login fails after password reset" (body: describes a broken login flow)
The `search_issues` call returns issue #7 (closed) with title "Login broken after reset password",
which is substantially the same. The user approves.

## Expected Behavior
Even though the issue describes a bug, the `duplicate` label takes precedence.
The triage table should show #20 → duplicate (with #7 noted as evidence).
After approval, `issue_write` is called with `labels: ["duplicate"]`.

## Pass Criteria
- [ ] `search_issues` was called for issue #20
- [ ] #20 was proposed as `duplicate`, not `bug`
- [ ] The reasoning in the table references #7 as the matching issue
- [ ] `issue_write` was called with `labels: ["duplicate"]`
