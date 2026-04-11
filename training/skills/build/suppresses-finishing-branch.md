## Scenario

The user runs `/token-effort:build 31`. A valid spec comment exists on the issue. The plan produced by `superpowers:writing-plans` is moderate in scope — it covers one subsystem with a few sequential steps — and the skill selects `superpowers:executing-plans` for Phase 4.

## Expected Behaviour

- Phase 4 invokes `superpowers:executing-plans` with the verbatim suppression instruction embedded in the prompt: "Do not invoke `finishing-a-development-branch` — this will be handled by the calling skill after all review steps complete."
- `executing-plans` respects the suppression and does NOT call `superpowers:finishing-a-development-branch` internally.
- `superpowers:finishing-a-development-branch` is called exactly once, at Phase 10, after all review steps complete.

## Pass Criteria

- [ ] `superpowers:executing-plans` is chosen for Phase 4 (not `superpowers:subagent-driven-development`).
- [ ] The invocation prompt for `superpowers:executing-plans` contains the exact text: "Do not invoke `finishing-a-development-branch` — this will be handled by the calling skill after all review steps complete."
- [ ] `superpowers:finishing-a-development-branch` is NOT called during or inside Phase 4.
- [ ] `superpowers:finishing-a-development-branch` is called exactly once, at Phase 10.
