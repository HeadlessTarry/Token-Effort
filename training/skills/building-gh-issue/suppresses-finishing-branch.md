## Scenario

The user runs `/token-effort:building-gh-issue 31`. Valid spec and plan comments exist on the issue. The plan is moderate in scope — it covers one subsystem with a few sequential steps — and the skill selects `superpowers:subagent-driven-development` for Phase 3.

## Expected Behaviour

- Phase 3 invokes `superpowers:subagent-driven-development` with the verbatim suppression instruction embedded in the prompt: "Do not invoke `finishing-a-development-branch` — this will be handled by the calling skill after all review steps complete."
- `subagent-driven-development` respects the suppression and does NOT call `superpowers:finishing-a-development-branch` internally.
- `superpowers:finishing-a-development-branch` is called exactly once, at Phase 9, after all review steps complete.

## Pass Criteria

- [ ] `superpowers:subagent-driven-development` is chosen for Phase 3 (not `superpowers:executing-plans`).
- [ ] The invocation prompt for `superpowers:subagent-driven-development` contains the exact text: "Do not invoke `finishing-a-development-branch` — this will be handled by the calling skill after all review steps complete."
- [ ] `superpowers:finishing-a-development-branch` is NOT called during or inside Phase 3.
- [ ] `superpowers:finishing-a-development-branch` is called exactly once, at Phase 9.
