## Scenario

The skill is invoked from Phase 8 of `/building-gh-issue` for issue #49. The spec context contains a "Context" section, a "Decision" section, and a "Consequences" section. The `docs/decisions/` directory already exists and is empty.

## Expected Behavior

The skill auto-populates Context, Decision, and Consequences from the spec. It presents the complete draft ADR in a single review prompt. The user replies "yes", and the skill writes and commits the file.

## Pass Criteria

- [ ] Auto-filled Context, Decision, and Consequences from spec sections (no per-field prompts)
- [ ] No `[TODO: ...]` placeholders in auto-filled sections
- [ ] Presented complete draft ADR in a single review prompt
- [ ] No file written and no `git commit` run before user replied "yes"
- [ ] Creates file at `docs/decisions/YYYY-MM-<slug>.md` using current year + zero-padded month
- [ ] Status line is `Active` (no supersession)
- [ ] Issue link in ADR points to `https://github.com/<owner>/<repo>/issues/49`
- [ ] Commit message matches `docs: record decision YYYY-MM-<slug> (issue #49)`
- [ ] Reports committed file path to user
