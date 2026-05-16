## Scenario

The repo contains `.github/ISSUE_TEMPLATE/issue-report.md` with frontmatter:
```yaml
---
name: Bug Report
about: Report an issue
labels: ["triage"]
---
```
The `labels` field does not contain "bug" or "defect", but the `name` field contains "Bug".

## Expected Behaviour

- Tier 1 does not match — `labels` contains only "triage".
- Tier 2 matches — `name` contains "Bug" (case-insensitive).
- The template body is extracted and used to structure the Phase 2 interview.

## Pass Criteria

- [ ] Tier 1 does not match (labels field lacks "bug"/"defect").
- [ ] Tier 2 checks the `name` frontmatter field for "bug" or "defect" (case-insensitive).
- [ ] The template is matched at Tier 2 because `name` contains "Bug".
- [ ] The skill proceeds to use this template's sections for the interview.
