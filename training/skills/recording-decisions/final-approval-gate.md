## Scenario

The user invokes `/recording-decisions` standalone. They provide issue #55 and the skill auto-fills what it can from the issue body, using `[TODO: ...]` placeholders for the rest. After Phase 3 (no supersession), the skill presents the full rendered ADR in a single review prompt and the user replies "yes".

## Expected Behavior

The skill assembles the complete ADR in memory after Phase 3 and presents it in a single review prompt. It waits for the user's "yes", then proceeds to create the directory, write the file, and commit. No file is written or committed before the "yes" reply.

## Pass Criteria

- [ ] Single review prompt called after Phase 3 with the full rendered ADR (heading, Status, Issue, Date, Context, Decision, Consequences) in the prompt body
- [ ] No `mkdir` or file write occurred before the user replied "yes"
- [ ] After "yes": `docs/decisions/YYYY-MM-use-postgres-for-persistence.md` created
- [ ] Committed with message `docs: record decision YYYY-MM-use-postgres-for-persistence (issue #55)`
