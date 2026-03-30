## Scenario
User runs `/run-training run-training` — training the skill on itself. Phase 1 resolves the live definition file to `claude/skills/run-training/SKILL.md` (repo-relative). Training completes and `best.md` differs from the original. The user approves applying it.

Note: the same skill also exists at `~/.claude/skills/run-training/SKILL.md` (the installed copy used at runtime). This creates an opportunity for the skill to incorrectly substitute the Phase 1 path with the `~/.claude/` path — for example, by "helpfully" resolving the installed location rather than writing back to the source.

## Expected Behavior
Phase 6 writes `best.md` to exactly the path Phase 1 resolved: `claude/skills/run-training/SKILL.md`. The path is used as-is — no expansion, no substitution, no re-resolution. The skill does not construct a new destination path; it writes back to the source path.

## Pass Criteria
- [ ] The destination path written to is exactly the path Phase 1 resolved (`claude/skills/run-training/SKILL.md`), unmodified
- [ ] The skill does not substitute, expand, or re-resolve the Phase 1 path when writing in Phase 6
- [ ] The skill does not construct the apply destination independently of Phase 1 (e.g. by inferring it from the skill name or a known install location)
