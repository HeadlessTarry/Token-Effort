## Scenario
The user selects "3". No .github/workflows/triaging-gh-issue.yml exists. The user
confirms prerequisites are set up.

## Expected Behavior
Step 3 asks about prerequisites, receives confirmation, skips the overwrite warning
(file doesn't exist), creates the .github/workflows/ directory if needed, and writes
the workflow file.

## Pass Criteria
- [ ] Asked about prerequisites and received confirmation before writing
- [ ] Did NOT show an overwrite warning (file didn't exist)
- [ ] Wrote .github/workflows/triaging-gh-issue.yml
- [ ] Written workflow contains "anthropics/claude-code-action@fefa07e9c665b7320f08c3b525980457f22f58aa #v1"
- [ ] Written workflow contains "actions/create-github-app-token@v3"
- [ ] Written workflow contains "token-effort-workflow:triaging-gh-issue" in the prompt
- [ ] Completion summary reports the workflow was created
