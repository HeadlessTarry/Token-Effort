## Scenario
The skill is invoked from Phase 9 of `/build` for issue #49. The spec context
contains a "Context" section, a "Decision" section, and a "Consequences" section.
The `docs/decisions/` directory already exists and is empty.

## Expected Behavior
The skill auto-populates Context, Decision, and Consequences from the spec.
It presents each field for confirmation, then writes and commits the ADR file.

## Pass Criteria
- [ ] Prompts for confirmation of each field (does not silently accept without showing)
- [ ] Creates file at `docs/decisions/YYYY-MM-<slug>.md` using current year + zero-padded month
- [ ] Status line is `Active` (no supersession)
- [ ] Issue link in ADR points to `https://github.com/<owner>/<repo>/issues/49`
- [ ] Commit message matches `docs: record decision YYYY-MM-<slug> (issue #49)`
- [ ] Reports committed file path to user
