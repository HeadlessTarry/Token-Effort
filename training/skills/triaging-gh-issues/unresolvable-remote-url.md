## Scenario
The user runs `/triaging-gh-issues` in a repo where `git remote get-url origin` fails
(e.g. no remote configured).

## Expected Behavior
The skill catches the failure and asks the user to provide the owner/repo manually
(e.g. "I could not determine the GitHub repository from `git remote get-url origin`.
Please provide the owner/repo (e.g. `acme/my-repo`)."). It does not proceed to list issues.

## Pass Criteria
- [ ] `git remote get-url origin` was attempted
- [ ] Execution stopped after the failure (no `list_issues` call made)
- [ ] The user was asked to provide the owner/repo explicitly
