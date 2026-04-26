## Scenario
The skill is invoked from Phase 8 of `/token-effort:building-gh-issue` for issue #49. The spec context
contains a "Context" section, a "Decision" section, and a "Consequences" section.
The `docs/decisions/` directory already exists and is empty.

## Expected Behavior
The skill auto-populates Context, Decision, and Consequences from the spec.
It calls `AskUserQuestion` to confirm each field, then presents the full rendered ADR
for final approval before writing and committing the file.

## Pass Criteria
- [ ] Called `AskUserQuestion` for Slug confirmation even though spec context was available
- [ ] Called `AskUserQuestion` for Context confirmation even though spec context was available
- [ ] Called `AskUserQuestion` for Decision confirmation even though spec context was available
- [ ] Called `AskUserQuestion` for Consequences confirmation even though spec context was available
- [ ] Called `AskUserQuestion` with full rendered ADR before writing any file
- [ ] No file written and no `git commit` run before user replied `yes`
- [ ] Creates file at `docs/decisions/YYYY-MM-<slug>.md` using current year + zero-padded month
- [ ] Status line is `Active` (no supersession)
- [ ] Issue link in ADR points to `https://github.com/<owner>/<repo>/issues/49`
- [ ] Commit message matches `docs: record decision YYYY-MM-<slug> (issue #49)`
- [ ] Reports committed file path to user
