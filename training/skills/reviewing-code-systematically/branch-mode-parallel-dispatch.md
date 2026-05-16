## Scenario
The skill is invoked on a feature branch (`feature/auth`) with commits ahead of `main`.
`computing-branch-diff` returns STATUS=ok with changed files and a diff.

## Expected Behavior
The skill calls `computing-branch-diff` once to get the review scope, then dispatches
all three reviewer agents (`reviewer-dead-code`, `reviewer-docs`, `reviewer-newcomer`)
in a single parallel batch — not one at a time.

## Pass Criteria
- [ ] `computing-branch-diff` is called to compute branch scope
- [ ] All three reviewers are dispatched in a single parallel batch
- [ ] No reviewer is started before the others have been initiated
- [ ] Each task prompt contains `MODE=branch` as the first line of the review scope block
