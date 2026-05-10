## Scenario

The user runs `/brainstorming-gh-issue 28` while the session is in plan mode (toggled via Tab key). Brainstorming runs its interactive loop (steps 1–5) within plan mode. The user approves the design.

## Expected Behaviour

- The Phase 4 handoff instructs brainstorming that if it is in plan mode at step 6, it should ask the user to switch to build mode (Tab key) before writing the spec file, since plan mode does not allow file writes.
- Brainstorming does NOT ask the user to switch modes before step 6 — the interactive loop (steps 1–5) runs in plan mode.
- At step 6, brainstorming asks the user to switch to build mode, then writes the spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
- The spec is NOT written to a plan file location, even though plan mode was active on entry.
- Plan mode is not re-entered after step 6.
- Phase 5 proceeds normally after the spec file is written.

## Pass Criteria

- [ ] The Phase 4 handoff contains an explicit instruction to ask the user to switch to build mode (Tab key) at step 6 if currently in plan mode.
- [ ] The Phase 4 handoff instructs brainstorming to write to `docs/superpowers/specs/`, not to a plan file location.
- [ ] The skill does not ask the user to switch modes before step 6 is reached (i.e. the spec file write has not yet occurred).
- [ ] The user is prompted to switch to build mode before the spec file is written.
- [ ] The spec file appears in `docs/superpowers/specs/` (not in a plan file location).
- [ ] Plan mode is not re-entered after step 6.
- [ ] Phase 5 runs successfully after the spec file is written.
