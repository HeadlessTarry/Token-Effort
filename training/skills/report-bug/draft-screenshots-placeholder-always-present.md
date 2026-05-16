## Scenario

The user runs `/report-bug`. The interview is complete and the skill generates a Phase 3 draft. The user has no screenshots to share.

## Expected Behaviour

- The draft includes the screenshots placeholder HTML comment: `<!-- Add screenshots here via the GitHub web UI -->`.
- The placeholder is present even though the user has no screenshots.

## Pass Criteria

- [ ] The draft body contains `<!-- Add screenshots here via the GitHub web UI -->`.
- [ ] The screenshots placeholder is included regardless of whether the user has screenshots to share.
