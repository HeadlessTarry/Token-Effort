## Scenario

The user runs `/token-effort:build 44`. A valid spec comment exists and the plan executes successfully through Phase 4. In Phase 5, the skill attempts to invoke `/verify`, but the skill is not available in this project.

## Expected Behaviour

- Phase 5 attempts to invoke `/verify`.
- Because `/verify` is unavailable, a named warning is logged: "⚠️ Phase 5 skipped: `/verify` skill not available in this project".
- Execution continues without stopping; Phase 6 (inline simplify pass) runs next.

## Pass Criteria

- [ ] An attempt to invoke `/verify` is made in Phase 5.
- [ ] A named warning is logged that includes both "Phase 5 skipped" and "/verify".
- [ ] Execution does NOT stop or error out after the warning.
- [ ] Phase 6 (inline simplify pass) runs after the warning is logged.
