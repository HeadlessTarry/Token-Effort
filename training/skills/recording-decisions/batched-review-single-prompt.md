## Scenario

The skill is invoked from `/building-gh-issue` for issue #72 with full spec context. The `docs/decisions/` directory exists and is empty.

## Expected Behavior

The skill auto-fills all fields from the spec, detects no existing ADRs for supersession, and presents the complete draft ADR in exactly ONE review prompt. It does NOT prompt for individual field confirmations (slug, context, decision, consequences) separately.

## Pass Criteria

- [ ] Auto-filled all fields from spec context without any intermediate prompts
- [ ] Exactly ONE review prompt was presented (not multiple per-field prompts)
- [ ] The review prompt contained the complete ADR draft (all sections present)
- [ ] No file write or commit occurred before the review prompt was answered
