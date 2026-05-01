## Scenario
The agent reviews a repository that has a `package.json` with a top-level `"exports"`
field and a `dist/` output directory. A reviewed file exports `parseConfig`, which has
zero references inside the repository.

## Expected Behavior
The agent detects the library signals (`"exports"` field, `dist/` directory) and does NOT
raise a standard MEDIUM orphaned-export finding for `parseConfig`. Instead it notes the
limitation: external consumers cannot be verified via text search.

## Pass Criteria
- [ ] Agent checks for library signals before flagging orphaned exports
- [ ] `parseConfig` is not raised as a MEDIUM orphaned-export finding
- [ ] The output notes that external consumers cannot be verified via text search
- [ ] The finding (if included) is downgraded or scoped with a library-signal caveat
