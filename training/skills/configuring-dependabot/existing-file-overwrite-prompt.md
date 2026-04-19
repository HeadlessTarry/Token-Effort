## Scenario
A repository has .github/workflows/ci.yml. An existing .github/dependabot.yml is present
containing only a github-actions entry with the standard weekly schedule (no cooldown).

## Expected Behavior
The skill detects github-actions. Phase 2 reads the existing file, classifies github-actions
as Identical, and stops cleanly without writing — no whole-file overwrite prompt is shown.

## Pass Criteria
- [ ] Detected github-actions ecosystem from .github/workflows/ci.yml
- [ ] Read the existing .github/dependabot.yml and extracted package-ecosystem values
- [ ] Classified github-actions as Identical (no whole-file overwrite prompt shown)
- [ ] Did NOT write or modify the file
- [ ] Reported that the file is already up to date
