## Scenario

The user invokes `/token-effort-workflow:recording-decisions` standalone. They fill in all fields
(issue #55, slug `use-postgres-for-persistence`, short Context, Decision, and Consequences).
After Phase 3 (no supersession), the skill presents the full rendered ADR and the user
replies `yes`.

## Expected Behavior

The skill assembles the complete ADR in memory after Phase 3, calls `AskUserQuestion` with
the full rendered ADR body, waits for the user's `yes`, then proceeds to create the directory,
write the file, and commit. No file is written or committed before the `yes` reply.

## Pass Criteria

- [ ] `AskUserQuestion` called after Phase 3 with the full rendered ADR (heading, Status, Issue, Date, Context, Decision, Consequences) in the prompt body
- [ ] No `mkdir` or file write occurred before the user replied `yes`
- [ ] After `yes`: `docs/decisions/YYYY-MM-use-postgres-for-persistence.md` created
- [ ] Committed with message `docs: record decision YYYY-MM-use-postgres-for-persistence (issue #55)`
