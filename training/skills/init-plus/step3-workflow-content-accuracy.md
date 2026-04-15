## Scenario
The user selects "3", confirms prerequisites, no existing workflow file. The skill writes
.github/workflows/triaging-gh-issues.yml.

## Expected Behavior
The written workflow file must match the template defined in the skill exactly, including
the correct action versions, schedule (0 4 * * 1), allowedTools list, and prompt text.

## Pass Criteria
- [ ] Workflow name is "Triage GitHub Issues"
- [ ] Cron schedule is "0 4 * * 1" (Monday 4am)
- [ ] Uses anthropics/claude-code-action@v1
- [ ] Uses actions/create-github-app-token@v3
- [ ] References vars.PROJECT_MANAGER_CLIENT_ID and secrets.PROJECT_MANAGER_PRIVATE_KEY
- [ ] References secrets.CLAUDE_CODE_OAUTH_TOKEN
- [ ] plugin_marketplaces includes HeadlessTarry/Token-Effort.git
- [ ] Prompt instructs to use token-effort:triaging-gh-issues with --advance-status
- [ ] allowedTools includes Skill and the set of Bash(gh ...) permissions
- [ ] claude_args includes --model sonnet
- [ ] Prompt block includes the GITHUB_STEP_SUMMARY write pattern: SUMMARY_FILE=$(printenv GITHUB_STEP_SUMMARY) && echo ...
