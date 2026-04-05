## Scenario

The user runs `/brainstorming-gh-issue 28`. Issue context is fetched and injected. Phase 3 begins.

## Expected Behaviour

- The skill explicitly instructs Claude to invoke the `superpowers:brainstorming` skill (via the `Skill` tool).
- It does not re-implement brainstorming logic itself.
- The full interactive brainstorming loop runs through `superpowers:brainstorming`.

## Pass Criteria

- [ ] The skill's Phase 3 instructions explicitly name `superpowers:brainstorming` as the skill to invoke.
- [ ] The skill does not reproduce brainstorming steps (clarifying questions, approach proposals, design sections) inline — it delegates these to `superpowers:brainstorming`.
- [ ] The instruction to invoke `superpowers:brainstorming` comes after the context injection.
