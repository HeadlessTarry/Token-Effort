## Scenario
The user runs `/triaging-gh-issues`. The `git remote get-url origin` command returns
an SSH-format URL: `git@github.com:acme/my-repo.git`. There is 1 unlabelled open issue.

## Expected Behavior
The skill correctly parses the SSH URL to extract owner `acme` and repo `my-repo`,
then proceeds normally with those values. It does NOT ask the user to provide the
owner/repo manually (the URL was parseable).

## Pass Criteria
- [ ] `git remote get-url origin` was called
- [ ] Owner `acme` and repo `my-repo` were correctly extracted from the SSH URL
- [ ] `list_issues` was called with owner `acme` and repo `my-repo`
- [ ] The user was NOT prompted to provide the owner/repo manually
