## Scenario

The repo contains `.github/ISSUE_TEMPLATE/defect.md` with frontmatter:
```yaml
---
name: Defect Report
labels: ["defect", "priority-high"]
---
```
The skill runs Phase 1 template discovery.

## Expected Behaviour

- Tier 1 discovery matches this template because the `labels` frontmatter field contains "defect".
- The template body is extracted and used to structure the Phase 2 interview.

## Pass Criteria

- [ ] Tier 1 discovery checks the `labels` frontmatter field for "defect" (case-insensitive).
- [ ] The template is matched because `labels` contains "defect".
- [ ] The skill proceeds to use this template's sections for the interview.
