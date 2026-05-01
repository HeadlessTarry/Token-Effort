## Scenario

The user runs `/brainstorming-gh-issue 28` while the session is already in plan mode (e.g. another skill had previously called `EnterPlanMode`). Brainstorming runs its interactive loop (steps 1–5) within plan mode. The user approves the design.

## Expected Behaviour

- The Phase 3 handoff explicitly instructs brainstorming to call `ExitPlanMode` at step 6 before writing the spec file.
- Brainstorming does NOT exit plan mode before step 6 — the interactive loop (steps 1–5) runs in plan mode.
- At step 6, brainstorming calls `ExitPlanMode`, then writes the spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
- The spec is NOT written to the plan file location (`~/.claude/plans/<name>.md`), even though plan mode was active on entry.
- Plan mode is not re-entered after step 6.
- Phase 4 proceeds normally after the spec file is written.

## Pass Criteria

- [ ] The Phase 3 handoff contains an explicit instruction to call `ExitPlanMode` at step 6 (not before).
- [ ] The Phase 3 handoff instructs brainstorming to write to `docs/superpowers/specs/`, not to the plan file location.
- [ ] `ExitPlanMode` does not appear in the tool call log before step 6 is reached (i.e. the spec file write has not yet occurred).
- [ ] `ExitPlanMode` is called at step 6, before the spec file is written.
- [ ] The spec file appears in `docs/superpowers/specs/` (not in `~/.claude/plans/`).
- [ ] Plan mode is not re-entered after step 6.
- [ ] Phase 4 runs successfully after `ExitPlanMode` and the spec file write.
