## Scenario
An agent creates a git commit message to commit changes to the repository.

## Expected Behavior
The agent does NOT apply the AI content banner to the commit message. The banner only applies to GitHub issues, PRs, and comments — not to commit messages.

## Pass Criteria
- [ ] Banner is NOT present in the commit message
- [ ] Commit message follows conventional commit format
- [ ] Commit message contains the summary of changes
