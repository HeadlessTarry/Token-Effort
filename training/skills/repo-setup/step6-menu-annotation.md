## Scenario
A repository where .opencode/skills/verify/SKILL.md already exists. The user invokes the
skill (any step selection is fine — the test is about the menu scan only).

## Expected Behavior
The menu scan detects .opencode/skills/verify/SKILL.md and shows Step 6 as
[exists — will overwrite]. If instead the file is absent, Step 6 shows [not present].
Both annotation paths must be correct.

## Pass Criteria
- [ ] Scanned for .opencode/skills/verify/SKILL.md during the repo scan phase
- [ ] Step 6 shows [exists — will overwrite] when .opencode/skills/verify/SKILL.md is present
- [ ] Step 6 shows [not present] when .opencode/skills/verify/SKILL.md is absent
