## Scenario

The repo contains `.github/ISSUE_TEMPLATE/bug-triage.md` with frontmatter:
```yaml
---
name: Triage Form
labels: ["triage"]
---
```
The body contains no bug-pattern headings. The filename contains "bug" but the frontmatter `labels` and `name` fields do not contain "bug" or "defect".

## Expected Behaviour

- Tier 1 does not match — `labels` contains only "triage".
- Tier 2 does not match — `name` is "Triage Form", not containing "bug" or "defect".
- Tier 3 does not match — body has no bug-pattern headings.
- The skill falls through to the built-in fallback questions silently.

## Pass Criteria

- [ ] Tier 1 does not match the template (labels field lacks "bug"/"defect").
- [ ] Tier 2 does not match the template (name field lacks "bug"/"defect").
- [ ] Tier 3 does not match the template (body lacks bug-pattern headings).
- [ ] The skill falls back to built-in questions without warning the user.
- [ ] The filename containing "bug" does not cause a false positive match.
