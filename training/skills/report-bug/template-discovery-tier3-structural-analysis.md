## Scenario

The repo contains `.github/ISSUE_TEMPLATE/general.md` with frontmatter:
```yaml
---
name: General Issue
labels: ["general"]
---
```
The template body contains headings: `## Describe the bug`, `## To Reproduce`, `## Expected behavior`. Neither `labels` nor `name` contain "bug" or "defect".

## Expected Behaviour

- Tier 1 does not match — `labels` contains only "general".
- Tier 2 does not match — `name` is "General Issue".
- Tier 3 matches — the body contains bug-pattern headings ("Describe the bug", "To Reproduce", "Expected behavior").
- The template body is extracted and used to structure the Phase 2 interview.

## Pass Criteria

- [ ] Tier 1 does not match (labels field lacks "bug"/"defect").
- [ ] Tier 2 does not match (name field lacks "bug"/"defect").
- [ ] Tier 3 checks the template body for bug-pattern headings: "Describe the bug", "To Reproduce", "Steps to reproduce", "Expected behavior", "reproduction steps" (case-insensitive).
- [ ] The template is matched at Tier 3 because the body contains bug-pattern headings.
- [ ] The skill proceeds to use this template's sections for the interview.
