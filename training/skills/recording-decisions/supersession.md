## Scenario
The skill is invoked from `/token-effort:building-gh-issue`. `docs/decisions/` contains two existing ADRs:
`2025-11-use-sqlite-for-storage.md` and `2025-08-auth-middleware-approach.md`.
The user selects `2025-11-use-sqlite-for-storage.md` as superseded.

## Expected Behavior
The new ADR's Status line says `Supersedes [2025-11-use-sqlite-for-storage](...)`.
The superseded file gets a `> ⚠️ Superseded by [...]` note prepended after its
heading. Both files are included in the same commit.

## Pass Criteria
- [ ] New ADR Status reads `Supersedes [2025-11-use-sqlite-for-storage](2025-11-use-sqlite-for-storage.md)`
- [ ] `> ⚠️ Superseded by [YYYY-MM-new-slug](YYYY-MM-new-slug.md)` line added to superseded file immediately after its `#` heading
- [ ] Both new ADR and modified superseded file staged in same commit
- [ ] Commit message still matches `docs: record decision YYYY-MM-<slug> (issue #N)`
- [ ] Unselected ADR (`2025-08-auth-middleware-approach.md`) is not modified
