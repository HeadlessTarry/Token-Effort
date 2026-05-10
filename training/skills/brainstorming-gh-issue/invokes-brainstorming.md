## Scenario

The user runs `/brainstorming-gh-issue 28`. Issue context is fetched and injected. Phase 4 begins.

## Expected Behaviour

- The skill explicitly invokes the `brainstorming` skill (via the `skill` tool).
- It does not re-implement brainstorming logic itself.
- The full interactive brainstorming loop runs through `brainstorming`.

## Pass Criteria

- [ ] The skill's Phase 4 instructions explicitly name `brainstorming` as the skill to invoke.
- [ ] The skill does not reproduce brainstorming steps (clarifying questions, approach proposals, design sections) inline — it delegates these to `brainstorming`.
- [ ] The instruction to invoke `brainstorming` comes after the context injection.
