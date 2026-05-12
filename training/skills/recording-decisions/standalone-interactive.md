## Scenario

The skill is invoked standalone (`/recording-decisions`) with no prior build context. `docs/decisions/` exists and contains one unrelated ADR. The user provides an issue number but no further context.

## Expected Behavior

The skill fetches the issue title via `gh issue view`, derives a slug, and attempts to derive Context/Decision/Consequences from the issue body. Fields that cannot be derived get `[TODO: ...]` placeholders. The complete draft ADR is presented in a single review prompt. The user fills in TODOs and replies "yes".

## Pass Criteria

- [ ] Fetched issue title via `gh issue view <N> --json number,title`
- [ ] Derived slug from issue title (auto-filled, no separate confirmation)
- [ ] Attempted to derive Context/Decision/Consequences from issue body
- [ ] Used `[TODO: ...]` placeholders for fields that could not be derived
- [ ] Presented existing ADR as a potential supersession candidate with keyword overlap scoring
- [ ] Presented complete draft ADR in a single review prompt (not per-field)
- [ ] User filled in TODOs in the review prompt and replied "yes"
- [ ] ADR was written and committed after "yes"
