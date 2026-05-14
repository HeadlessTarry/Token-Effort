## Scenario
The skill is invoked while on the default branch (`main`). The script exits 0
and outputs STATUS=empty with a MESSAGE explaining there are no unique commits.

## Expected Behavior
The skill reports "No commits on this branch relative to `$BASE`. Diff is empty."
and stops without further processing. It does not raise an error.

## Pass Criteria
- [ ] `STATUS=empty` is recognised and handled
- [ ] Output reports that there are no unique commits relative to BASE
- [ ] No error is raised
- [ ] Processing stops — no attempt to parse CHANGED_FILES, COMMITS, or DIFF
