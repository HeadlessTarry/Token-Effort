## Scenario
User completes the repo-setup flow. The skill reaches Phase 3 (Completion).

## Expected Behavior
The skill prints a summary covering both phases, with accurate outcomes. It does not make a git commit.

## Pass Criteria
- [ ] Completion summary includes "Issue templates: [created/skipped]"
- [ ] Completion summary includes "Dependabot: [configured/skipped]"
- [ ] Skill does not make a git commit after setup
