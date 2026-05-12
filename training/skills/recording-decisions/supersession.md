## Scenario

The skill is invoked from `/building-gh-issue`. `docs/decisions/` contains two existing ADRs: `2025-11-use-sqlite-for-storage.md` and `2025-08-auth-middleware-approach.md`. The spec content mentions "sqlite" and "storage" keywords. The user confirms `2025-11-use-sqlite-for-storage.md` as superseded in the review prompt.

## Expected Behavior

The skill detects keyword overlap and highlights `2025-11-use-sqlite-for-storage` as a suggested supersession candidate. The new ADR's Status line says `Supersedes [2025-11-use-sqlite-for-storage](...)`. The superseded file gets a `> ⚠️ Superseded by [...]` note prepended after its heading. Both files are included in the same commit.

## Pass Criteria

- [ ] Scanned existing ADRs and performed keyword overlap scoring on slugs
- [ ] Highlighted `2025-11-use-sqlite-for-storage` as a suggested supersession candidate in the draft
- [ ] New ADR Status reads `Supersedes [2025-11-use-sqlite-for-storage](2025-11-use-sqlite-for-storage.md)`
- [ ] `> ⚠️ Superseded by [YYYY-MM-new-slug](YYYY-MM-new-slug.md)` line added to superseded file immediately after its `#` heading
- [ ] Both new ADR and modified superseded file staged in same commit
- [ ] Commit message still matches `docs: record decision YYYY-MM-<slug> (issue #N)`
- [ ] Unselected ADR (`2025-08-auth-middleware-approach.md`) is not modified
