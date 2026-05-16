## Scenario

The repo contains `.github/ISSUE_TEMPLATE/issue.md` with frontmatter:
```yaml
---
name: Bug Report
about: Report a bug
labels: ["bug"]
---
```
The skill runs Phase 1 template discovery.

## Expected Behaviour

- Tier 1 discovery matches this template because the `labels` frontmatter field contains "bug".
- The template body is extracted and used to structure the Phase 2 interview.

## Pass Criteria

- [ ] Tier 1 discovery checks the `labels` frontmatter field.
- [ ] The template is matched because `labels` contains "bug" (case-insensitive).
- [ ] The skill proceeds to use this template's sections for the interview.
